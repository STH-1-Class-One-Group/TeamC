import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, ProfileFormValues } from '../../features/profile/types';
import {
  getCadreRankFieldOptions,
  getProviderLabel,
  getTodayInputValue,
  isNicknameAvailable,
  PROFILE_ACQUAINTANCE_SERVICE_TRACK_OPTIONS,
  PROFILE_CADRE_CATEGORY_OPTIONS,
  PROFILE_SERVICE_TRACK_OPTIONS,
  PROFILE_USER_TYPE_OPTIONS,
  saveProfile,
} from '../../features/profile/profileFormUtils';
import {
  calculateServiceTimeline,
  getCadreRankFieldLabel,
  isCadreUser,
  isEnlistedUser,
} from '../../utils/serviceDates';
import { getProfileMode } from '../../features/profile/profileModes';

interface ProfileSetupModalProps {
  user: User;
  initialProfile?: Profile | null;
  onProfileCreated: (profile: Profile) => void;
  onSignOut: () => void;
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

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  user,
  initialProfile = null,
  onProfileCreated,
  onSignOut,
}) => {
  const [form, setForm] = useState<ProfileFormValues>(createFormState(initialProfile));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const todayInputValue = getTodayInputValue();
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
    setForm(createFormState(initialProfile));
    setErrors({});
    setSubmitError('');
  }, [initialProfile]);

  const providerLabel = getProviderLabel(user.app_metadata?.provider);

  const setField = (key: keyof ProfileFormValues, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setSubmitError('');
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
    setSubmitError('');
  };

  const checkNicknameAvailability = async () => {
    if (!form.nickname.trim()) return;
    setIsCheckingNickname(true);
    setErrors((current) => ({ ...current, nickname: '' }));
    const available = await isNicknameAvailable(form.nickname, user.id);
    setIsCheckingNickname(false);
    if (!available) {
      setErrors((current) => ({ ...current, nickname: '이미 사용 중인 닉네임입니다.' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const mode = getProfileMode(form.userType);
    const nextErrors = mode?.validate(form, todayInputValue) ?? { userType: '회원 유형을 선택해주세요.' };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');

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
          setSubmitError('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
        return;
      }

      onProfileCreated(data as Profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-xl p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="mb-6">
          <span className="text-primary font-semibold tracking-wider text-xs mb-1 block">WELCOME</span>
          <h2 className="text-xl font-bold text-on-surface dark:text-white">프로필 설정</h2>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">{providerLabel} 로그인 이후 사용할 프로필 정보를 입력해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-2 ml-1">회원 유형 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {PROFILE_USER_TYPE_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => applyUserType(option.value)} className={`rounded-xl border px-3 py-3 text-xs font-semibold transition-colors ${form.userType === option.value ? 'border-primary bg-primary/10 text-primary dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300' : 'border-slate-200 bg-surface-container-low text-on-surface dark:border-slate-700 dark:bg-slate-800 dark:text-white'}`}>{option.label}</button>
              ))}
            </div>
            {errors.userType && <p className="text-xs text-red-500 mt-1 ml-1">{errors.userType}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">닉네임 <span className="text-red-500">*</span></label>
            <input type="text" value={form.nickname} onChange={(event) => setField('nickname', event.target.value)} onBlur={checkNicknameAvailability} placeholder="사용할 닉네임을 입력하세요" maxLength={20} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white placeholder-slate-400 outline-none" />
            {isCheckingNickname && <p className="text-xs text-slate-400 mt-1 ml-1">중복 확인 중...</p>}
            {errors.nickname && <p className="text-xs text-red-500 mt-1 ml-1">{errors.nickname}</p>}
          </div>

          {form.userType === 'civilian' && (
            <>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/50">
                <p className="text-sm font-semibold text-on-surface dark:text-white">지인 복무 정보 <span className="text-slate-400 font-normal">(선택)</span></p>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">지인 1명의 현역병 정보를 입력하면 대시보드에서 해당 지인 기준 진행률을 보여줍니다.</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">지인 이름</label>
                <input type="text" value={form.acquaintanceName} onChange={(event) => setField('acquaintanceName', event.target.value)} placeholder="예: 김철수" maxLength={20} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white placeholder-slate-400 outline-none" />
                {errors.acquaintanceName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.acquaintanceName}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">지인 복무 유형</label>
                <select value={form.acquaintanceServiceTrack} onChange={(event) => setField('acquaintanceServiceTrack', event.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none appearance-none"><option value="">선택하세요</option>{PROFILE_ACQUAINTANCE_SERVICE_TRACK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label} · {option.durationLabel}</option>)}</select>
                {errors.acquaintanceServiceTrack && <p className="text-xs text-red-500 mt-1 ml-1">{errors.acquaintanceServiceTrack}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">지인 입대일</label>
                <input type="date" value={form.acquaintanceEnlistmentDate} max={todayInputValue} onChange={(event) => setField('acquaintanceEnlistmentDate', event.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none" />
                {errors.acquaintanceEnlistmentDate && <p className="text-xs text-red-500 mt-1 ml-1">{errors.acquaintanceEnlistmentDate}</p>}
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/50">
                <div className="text-sm font-semibold text-on-surface dark:text-white">지인 현재 계급</div>
                <div className="mt-2 text-lg font-bold text-on-surface dark:text-white">{serviceTimeline.displayRankLabel}</div>
              </div>
            </>
          )}

          {isEnlisted && (
            <>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">복무 유형 <span className="text-red-500">*</span></label>
                <select value={form.serviceTrack} onChange={(event) => setField('serviceTrack', event.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none appearance-none"><option value="">선택하세요</option>{PROFILE_SERVICE_TRACK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label} · {option.durationLabel}</option>)}</select>
                {errors.serviceTrack && <p className="text-xs text-red-500 mt-1 ml-1">{errors.serviceTrack}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">입대일 <span className="text-red-500">*</span></label>
                <input type="date" value={form.enlistmentDate} max={todayInputValue} onChange={(event) => setField('enlistmentDate', event.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none" />
                {errors.enlistmentDate && <p className="text-xs text-red-500 mt-1 ml-1">{errors.enlistmentDate}</p>}
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/50">
                <div className="text-sm font-semibold text-on-surface dark:text-white">현재 계급</div>
                <div className="mt-2 text-lg font-bold text-on-surface dark:text-white">{serviceTimeline.displayRankLabel}</div>
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">소속부대 <span className="text-slate-400 font-normal">(선택)</span></label>
                <input type="text" value={form.unit} onChange={(event) => setField('unit', event.target.value)} placeholder="예: 육군 제00사단" maxLength={50} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white placeholder-slate-400 outline-none" />
              </div>
            </>
          )}

          {isCadre && (
            <>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">간부 유형 <span className="text-red-500">*</span></label>
                <select value={form.cadreCategory} onChange={(event) => { setForm((current) => ({ ...current, cadreCategory: event.target.value, rank: '' })); setErrors((current) => ({ ...current, cadreCategory: '', rank: '' })); }} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none appearance-none"><option value="">선택하세요</option>{PROFILE_CADRE_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                {errors.cadreCategory && <p className="text-xs text-red-500 mt-1 ml-1">{errors.cadreCategory}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">{getCadreRankFieldLabel(form.cadreCategory)} <span className="text-red-500">*</span></label>
                <select value={form.rank} onChange={(event) => setField('rank', event.target.value)} disabled={!form.cadreCategory} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none appearance-none disabled:opacity-50"><option value="">선택하세요</option>{cadreRankOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                {errors.rank && <p className="text-xs text-red-500 mt-1 ml-1">{errors.rank}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">임용일/입대일 <span className="text-red-500">*</span></label>
                <input type="date" value={form.enlistmentDate} max={todayInputValue} onChange={(event) => setField('enlistmentDate', event.target.value)} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none" />
                {errors.enlistmentDate && <p className="text-xs text-red-500 mt-1 ml-1">{errors.enlistmentDate}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">소속부대/기관 <span className="text-slate-400 font-normal">(선택)</span></label>
                <input type="text" value={form.unit} onChange={(event) => setField('unit', event.target.value)} placeholder="예: 공군 제00비행단 / 국방부" maxLength={50} className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white placeholder-slate-400 outline-none" />
              </div>
            </>
          )}

          {submitError && <p className="text-xs text-red-500 text-center">{submitError}</p>}
          <button type="submit" disabled={isSubmitting || Object.values(errors).some(Boolean) || !form.nickname.trim()} className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">{isSubmitting ? '저장 중...' : '시작하기'}</button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={onSignOut} className="text-xs text-slate-400 hover:text-red-400 transition-colors">로그아웃</button>
        </div>
      </div>
    </div>
  );
};
