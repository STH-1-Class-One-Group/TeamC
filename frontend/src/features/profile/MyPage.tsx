import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import {
  ACQUAINTANCE_SERVICE_TRACK_OPTIONS,
  calculateServiceTimeline,
  getCadreCategoryLabel,
  getCadreRankFieldLabel,
  getUserTypeLabel,
  isCadreUser,
  isEnlistedUser,
} from '../../utils/serviceDates';
import { Profile, ProfileFormValues } from './types';
import {
  getCadreRankFieldOptions,
  getProviderLabel,
  getTodayInputValue,
  isNicknameAvailable,
  PROFILE_CADRE_CATEGORY_OPTIONS,
  PROFILE_SERVICE_TRACK_OPTIONS,
  PROFILE_USER_TYPE_OPTIONS,
  saveProfile,
} from './profileFormUtils';
import { getProfileMode } from './profileModes';

interface MyPageProps {
  user: User | null;
  profile: Profile | null;
  isProfileLoading: boolean;
  onProfileUpdated: (profile: Profile) => void;
}

type ErrorKey =
  | 'nickname'
  | 'userType'
  | 'cadreCategory'
  | 'rank'
  | 'serviceTrack'
  | 'enlistmentDate'
  | 'acquaintanceName'
  | 'acquaintanceServiceTrack'
  | 'acquaintanceEnlistmentDate';

type FormErrors = Partial<Record<ErrorKey, string>>;

const createFormState = (profile?: Profile | null): ProfileFormValues => ({
  nickname: profile?.nickname ?? '',
  userType: profile?.user_type ?? '',
  cadreCategory: profile?.cadre_category ?? '',
  rank: profile?.rank ?? '',
  unit: profile?.unit ?? '',
  enlistmentDate: profile?.enlistment_date ?? '',
  serviceTrack: profile?.service_track ?? '',
  acquaintanceName: profile?.acquaintance_name ?? '',
  acquaintanceServiceTrack: profile?.acquaintance_service_track ?? '',
  acquaintanceEnlistmentDate: profile?.acquaintance_enlistment_date ?? '',
});

const metaDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const MyPage: React.FC<MyPageProps> = ({ user, profile, isProfileLoading, onProfileUpdated }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileFormValues>(createFormState(profile));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const todayInputValue = getTodayInputValue();
  const providerLabel = getProviderLabel(user?.app_metadata?.provider);
  const isEnlisted = isEnlistedUser(form.userType);
  const isCadre = isCadreUser(form.userType);
  const cadreRankOptions = useMemo(() => getCadreRankFieldOptions(form.cadreCategory), [form.cadreCategory]);
  const serviceTimeline = calculateServiceTimeline({
    userType: form.userType,
    serviceTrack: form.serviceTrack,
    enlistmentDate: form.enlistmentDate,
    cadreCategory: form.cadreCategory,
    rank: form.rank,
    acquaintanceName: form.acquaintanceName,
    acquaintanceServiceTrack: form.acquaintanceServiceTrack,
    acquaintanceEnlistmentDate: form.acquaintanceEnlistmentDate,
  });

  useEffect(() => {
    if (!user && !isProfileLoading) navigate('/');
  }, [user, isProfileLoading, navigate]);

  useEffect(() => {
    setForm(createFormState(profile));
    setErrors({});
    setSaveError('');
    setSaveSuccess('');
  }, [profile]);

  const displayName = form.nickname.trim() || profile?.nickname || user?.email || '사용자';
  const identityText =
    form.userType === 'civilian'
      ? form.acquaintanceName.trim()
        ? `일반인 · 지인 ${form.acquaintanceName.trim()} 기준`
        : '일반인'
      : form.userType === 'active_enlisted'
        ? `현역군인(병) · ${serviceTimeline.displayRankLabel}`
        : `${getUserTypeLabel(form.userType)} · ${getCadreCategoryLabel(form.cadreCategory)}${form.rank ? ` · ${form.rank}` : ''}`;

  const setField = (key: keyof ProfileFormValues, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setSaveError('');
    setSaveSuccess('');
  };

  const applyUserType = (userType: string) => {
    setForm((current) => ({
      ...current,
      userType,
      cadreCategory: userType === 'active_cadre' ? current.cadreCategory : '',
      rank: userType === 'active_cadre' ? current.rank : '',
      unit: userType === 'civilian' ? '' : current.unit,
      enlistmentDate: userType === 'civilian' ? '' : current.enlistmentDate,
      serviceTrack: userType === 'active_enlisted' ? current.serviceTrack : '',
      acquaintanceName: userType === 'civilian' ? current.acquaintanceName : '',
      acquaintanceServiceTrack: userType === 'civilian' ? current.acquaintanceServiceTrack : '',
      acquaintanceEnlistmentDate: userType === 'civilian' ? current.acquaintanceEnlistmentDate : '',
    }));
    setErrors({});
  };

  const checkNickname = async () => {
    if (!user || !form.nickname.trim()) return;
    setIsCheckingNickname(true);
    const available = await isNicknameAvailable(form.nickname, user.id);
    setIsCheckingNickname(false);
    if (!available) {
      setErrors((current) => ({ ...current, nickname: '이미 사용 중인 닉네임입니다.' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const mode = getProfileMode(form.userType);
    const nextErrors = mode?.validate(form, todayInputValue) ?? { userType: '회원 유형을 선택해주세요.' };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const available = await isNicknameAvailable(form.nickname, user.id);
      if (!available) {
        setErrors((current) => ({ ...current, nickname: '이미 사용 중인 닉네임입니다.' }));
        return;
      }
      if (!mode) return;
      const { data, error } = await saveProfile(user.id, mode.normalize(form));
      if (error) {
        if (error.code === '23505') {
          setErrors((current) => ({ ...current, nickname: '이미 사용 중인 닉네임입니다.' }));
        } else {
          setSaveError('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
        return;
      }
      onProfileUpdated(data as Profile);
      setSaveSuccess('개인정보가 저장되었습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;
  if (isProfileLoading) return <div className="flex min-h-[50vh] items-center justify-center">프로필 정보를 불러오는 중입니다.</div>;

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_24px_90px_-48px_rgba(15,23,42,0.5)] dark:border-slate-800/80 dark:bg-slate-900/90 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">My Page</span>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">내 개인정보</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">현역병은 자동 계급, 현역간부는 유형별 계급/직급, 일반인은 지인 1명 기준 진행률을 관리합니다.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60"><div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">회원 유형</div><div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{getUserTypeLabel(form.userType)}</div></div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60"><div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">현재 계급/직급</div><div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{serviceTimeline.displayRankLabel}</div></div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60"><div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">D-Day</div><div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{serviceTimeline.dDayLabel}</div></div>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-6 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-4">
              <ProfileAvatar nickname={displayName} rank={form.rank} avatar_url={profile?.avatar_url} user_type={form.userType} service_track={form.serviceTrack} enlistment_date={form.enlistmentDate} containerClassName="h-20 w-20 overflow-hidden rounded-[24px] ring-4 ring-white dark:ring-slate-900" fallbackClassName="bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-500 text-white text-2xl font-black" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Active Identity</p>
                <h2 className="mt-1 truncate text-2xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{identityText}{form.unit ? ` · ${form.unit}` : ''}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                ['로그인 계정', user.email ?? '이메일 정보 없음'],
                ['로그인 제공자', providerLabel],
                ['간부 유형', isCadre ? getCadreCategoryLabel(form.cadreCategory) : '-'],
                ['지인 이름', form.userType === 'civilian' ? form.acquaintanceName.trim() || '-' : '-'],
                ['가입일', metaDate(user.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900/80"><div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</div><div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{value}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_16px_70px_-50px_rgba(15,23,42,0.55)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Service Timeline</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60"><div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">기준 대상</div><div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{serviceTimeline.subjectLabel}</div></div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60"><div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">복무/직군</div><div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{serviceTimeline.serviceLabel}</div><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">기준 {serviceTimeline.serviceDurationLabel}</p></div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60"><div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">입대일/임용일</div><div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{serviceTimeline.enlistmentLabel}</div></div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60"><div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">전역일</div><div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{serviceTimeline.dischargeLabel}</div></div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60"><div className="flex items-end justify-between gap-3"><div><div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">진행률</div><div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{serviceTimeline.progressPercent.toFixed(1)}%</div></div><div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">{serviceTimeline.dDayLabel}</div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#2563eb,#14b8a6)]" style={{ width: `${serviceTimeline.progressPercent.toFixed(1)}%` }} /></div><p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">{serviceTimeline.helperText}</p></div>
            </div>
          </div>
        </aside>

        <div className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_90px_-56px_rgba(15,23,42,0.55)] dark:border-slate-800/80 dark:bg-slate-900/85 md:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-6 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Profile Editor</span>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div><h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">개인정보 수정</h2><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">회원 유형별로 필요한 정보만 입력받고, 자동 계산되는 값은 미리보기로 보여줍니다.</p></div>
              <button type="button" onClick={() => { setForm(createFormState(profile)); setErrors({}); setSaveError(''); setSaveSuccess(''); }} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500/30 dark:hover:text-sky-200">변경 취소</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">회원 유형 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {PROFILE_USER_TYPE_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => applyUserType(option.value)} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${form.userType === option.value ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200' : 'border-slate-200 bg-slate-50/80 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200'}`}>{option.label}</button>
                ))}
              </div>
              {errors.userType && <p className="text-xs text-red-500">{errors.userType}</p>}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">닉네임 <span className="text-red-500">*</span></label>
                <input type="text" value={form.nickname} onChange={(event) => setField('nickname', event.target.value)} onBlur={checkNickname} maxLength={20} placeholder="사용할 닉네임을 입력하세요" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500" />
                {isCheckingNickname && <p className="text-xs text-slate-500 dark:text-slate-400">중복 확인 중...</p>}
                {errors.nickname && <p className="text-xs text-red-500">{errors.nickname}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">이메일</label>
                <input type="text" value={user.email ?? ''} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" />
              </div>
            </div>

            {form.userType === 'civilian' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">지인 이름 <span className="text-slate-400 font-normal">(선택)</span></label><input type="text" value={form.acquaintanceName} onChange={(event) => setField('acquaintanceName', event.target.value)} maxLength={20} placeholder="예: 김철수" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500" />{errors.acquaintanceName && <p className="text-xs text-red-500">{errors.acquaintanceName}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">지인 복무 유형 <span className="text-slate-400 font-normal">(선택)</span></label><select value={form.acquaintanceServiceTrack} onChange={(event) => setField('acquaintanceServiceTrack', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"><option value="">선택하세요</option>{ACQUAINTANCE_SERVICE_TRACK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label} · {option.durationLabel}</option>)}</select>{errors.acquaintanceServiceTrack && <p className="text-xs text-red-500">{errors.acquaintanceServiceTrack}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">지인 입대일 <span className="text-slate-400 font-normal">(선택)</span></label><input type="date" value={form.acquaintanceEnlistmentDate} max={todayInputValue} onChange={(event) => setField('acquaintanceEnlistmentDate', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500" />{errors.acquaintanceEnlistmentDate && <p className="text-xs text-red-500">{errors.acquaintanceEnlistmentDate}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">지인 현재 계급</label><div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{serviceTimeline.displayRankLabel}</div></div>
              </div>
            )}

            {isEnlisted && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">복무 유형 <span className="text-red-500">*</span></label><select value={form.serviceTrack} onChange={(event) => setField('serviceTrack', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"><option value="">선택하세요</option>{PROFILE_SERVICE_TRACK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label} · {option.durationLabel}</option>)}</select>{errors.serviceTrack && <p className="text-xs text-red-500">{errors.serviceTrack}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">입대일 <span className="text-red-500">*</span></label><input type="date" value={form.enlistmentDate} max={todayInputValue} onChange={(event) => setField('enlistmentDate', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500" />{errors.enlistmentDate && <p className="text-xs text-red-500">{errors.enlistmentDate}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">현재 계급</label><div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{serviceTimeline.displayRankLabel}</div></div>
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">소속부대 <span className="text-slate-400 font-normal">(선택)</span></label><input type="text" value={form.unit} onChange={(event) => setField('unit', event.target.value)} maxLength={50} placeholder="예: 육군 제00사단" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500" /></div>
              </div>
            )}

            {isCadre && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">간부 유형 <span className="text-red-500">*</span></label><select value={form.cadreCategory} onChange={(event) => { setForm((current) => ({ ...current, cadreCategory: event.target.value, rank: '' })); setErrors((current) => ({ ...current, cadreCategory: '', rank: '' })); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"><option value="">선택하세요</option>{PROFILE_CADRE_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{errors.cadreCategory && <p className="text-xs text-red-500">{errors.cadreCategory}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{getCadreRankFieldLabel(form.cadreCategory)} <span className="text-red-500">*</span></label><select value={form.rank} onChange={(event) => setField('rank', event.target.value)} disabled={!form.cadreCategory} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"><option value="">선택하세요</option>{cadreRankOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>{errors.rank && <p className="text-xs text-red-500">{errors.rank}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">임용일/입대일 <span className="text-red-500">*</span></label><input type="date" value={form.enlistmentDate} max={todayInputValue} onChange={(event) => setField('enlistmentDate', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500" />{errors.enlistmentDate && <p className="text-xs text-red-500">{errors.enlistmentDate}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">소속부대/기관 <span className="text-slate-400 font-normal">(선택)</span></label><input type="text" value={form.unit} onChange={(event) => setField('unit', event.target.value)} maxLength={50} placeholder="예: 공군 제00비행단 / 국방부" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500" /></div>
              </div>
            )}

            {(saveError || saveSuccess) && <div className={`rounded-2xl px-4 py-3 text-sm ${saveError ? 'border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'}`}>{saveError || saveSuccess}</div>}
            <div className="flex flex-col gap-4 border-t border-slate-200/70 pt-6 dark:border-slate-800 md:flex-row md:items-center md:justify-between"><p className="text-sm leading-6 text-slate-500 dark:text-slate-400">저장 후 헤더 이미지와 대시보드 진행률이 현재 설정 기준으로 바로 갱신됩니다.</p><button type="submit" disabled={isSaving || !form.nickname.trim() || Object.values(errors).some(Boolean)} className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#2563eb,#14b8a6)] px-7 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.8)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? '저장 중...' : '개인정보 저장'}</button></div>
          </form>
        </div>
      </section>
    </div>
  );
};
