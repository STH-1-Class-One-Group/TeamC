import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { calculateServiceTimeline } from '../../utils/serviceDates';
import { Profile, ProfileFormValues } from './types';
import {
  getProviderLabel,
  getTodayInputValue,
  isNicknameAvailable,
  PROFILE_RANKS,
  saveProfile,
} from './profileFormUtils';

interface MyPageProps {
  user: User | null;
  profile: Profile | null;
  isProfileLoading: boolean;
  onProfileUpdated: (profile: Profile) => void;
}

const formatDateLabel = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const MyPage: React.FC<MyPageProps> = ({
  user,
  profile,
  isProfileLoading,
  onProfileUpdated,
}) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileFormValues>({
    nickname: profile?.nickname ?? '',
    rank: profile?.rank ?? '',
    unit: profile?.unit ?? '',
    enlistmentDate: profile?.enlistment_date ?? '',
  });
  const [nicknameError, setNicknameError] = useState('');
  const [enlistmentDateError, setEnlistmentDateError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const todayInputValue = getTodayInputValue();
  const providerLabel = getProviderLabel(user?.app_metadata?.provider);
  const displayName = profile?.nickname || (user?.user_metadata?.full_name as string) || user?.email || '사용자';
  const serviceTimeline = calculateServiceTimeline(profile?.enlistment_date ?? form.enlistmentDate);

  useEffect(() => {
    if (!user && !isProfileLoading) {
      navigate('/');
    }
  }, [user, isProfileLoading, navigate]);

  useEffect(() => {
    setForm({
      nickname: profile?.nickname ?? '',
      rank: profile?.rank ?? '',
      unit: profile?.unit ?? '',
      enlistmentDate: profile?.enlistment_date ?? '',
    });
    setNicknameError('');
    setEnlistmentDateError('');
    setSaveError('');
    setSaveSuccess('');
  }, [profile]);

  const profileMeta = useMemo(
    () => [
      { label: '로그인 계정', value: user?.email ?? '이메일 정보 없음' },
      { label: '로그인 제공자', value: providerLabel },
      { label: '가입일', value: formatDateLabel(user?.created_at) },
      { label: '프로필 상태', value: profile?.profile_completed ? '설정 완료' : '설정 필요' },
    ],
    [profile?.profile_completed, providerLabel, user?.created_at, user?.email]
  );

  const handleFieldChange = (key: keyof ProfileFormValues, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveError('');
    setSaveSuccess('');

    if (key === 'nickname') {
      setNicknameError('');
    }

    if (key === 'enlistmentDate') {
      setEnlistmentDateError('');
    }
  };

  const handleNicknameBlur = async () => {
    if (!user || !form.nickname.trim()) {
      return;
    }

    setIsCheckingNickname(true);
    const available = await isNicknameAvailable(form.nickname, user.id);
    setIsCheckingNickname(false);

    if (!available) {
      setNicknameError('이미 사용 중인 닉네임입니다.');
    }
  };

  const handleReset = () => {
    setForm({
      nickname: profile?.nickname ?? '',
      rank: profile?.rank ?? '',
      unit: profile?.unit ?? '',
      enlistmentDate: profile?.enlistment_date ?? '',
    });
    setNicknameError('');
    setEnlistmentDateError('');
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      setSaveError('로그인이 필요합니다.');
      return;
    }

    if (!form.nickname.trim()) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }

    if (form.enlistmentDate && form.enlistmentDate > todayInputValue) {
      setEnlistmentDateError('입대일은 오늘 이후로 설정할 수 없습니다.');
      return;
    }

    if (nicknameError) {
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const available = await isNicknameAvailable(form.nickname, user.id);
      if (!available) {
        setNicknameError('이미 사용 중인 닉네임입니다.');
        return;
      }

      const { data, error } = await saveProfile(user.id, form);

      if (error) {
        if (error.code === '23505') {
          setNicknameError('이미 사용 중인 닉네임입니다.');
        } else {
          setSaveError('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
        return;
      }

      const nextProfile = data as Profile;
      onProfileUpdated(nextProfile);
      setSaveSuccess('개인정보가 저장되었습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-3xl border border-slate-200/70 bg-white/90 px-6 py-5 text-sm text-slate-600 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
          프로필 정보를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate space-y-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.2),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.16),_transparent_40%)]" />

      <section className="overflow-hidden rounded-[34px] border border-slate-200/70 bg-white/90 shadow-[0_30px_120px_-58px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/85">
        <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              My Page
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                개인 프로필과
                <br />
                복무 기준 정보를 관리하세요.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                닉네임, 계급, 소속부대, 입대일을 수정하면 커뮤니티 표시 정보와 군 복무일 계산 카드가 즉시 갱신됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  D-Day
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {serviceTimeline.dDayLabel}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Progress
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {serviceTimeline.progressPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/70 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-4">
              <ProfileAvatar
                nickname={displayName}
                rank={profile?.rank ?? form.rank}
                avatar_url={profile?.avatar_url}
                containerClassName="h-20 w-20 overflow-hidden rounded-[24px] ring-4 ring-white dark:ring-slate-900"
                fallbackClassName="bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-500 text-white text-2xl font-black"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Active Identity
                </p>
                <h2 className="mt-1 truncate text-2xl font-bold text-slate-900 dark:text-white">
                  {displayName}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {profile?.rank || form.rank || '계급 미설정'}
                  {(profile?.unit || form.unit) ? ` · ${profile?.unit || form.unit}` : ''}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {profileMeta.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_16px_70px_-50px_rgba(15,23,42,0.55)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Service Timeline
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  입대일
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {serviceTimeline.enlistmentLabel}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  전역일
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {serviceTimeline.dischargeLabel}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      복무 진행률
                    </div>
                    <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      {serviceTimeline.progressPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
                    {serviceTimeline.dDayLabel}
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#2563eb,#14b8a6)]"
                    style={{ width: `${serviceTimeline.progressPercent.toFixed(1)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                  {serviceTimeline.helperText}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_90px_-56px_rgba(15,23,42,0.55)] dark:border-slate-800/80 dark:bg-slate-900/85 md:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-6 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Profile Editor
            </span>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  개인정보 수정
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  커뮤니티 표시 정보와 복무 계산에 쓰이는 값을 여기서 직접 수정할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500/30 dark:hover:text-sky-200"
              >
                변경 취소
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  닉네임 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(event) => handleFieldChange('nickname', event.target.value)}
                  onBlur={handleNicknameBlur}
                  maxLength={20}
                  placeholder="사용할 닉네임을 입력하세요"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                />
                {isCheckingNickname && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">중복 확인 중...</p>
                )}
                {nicknameError && (
                  <p className="text-xs text-red-500">{nicknameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  이메일
                </label>
                <input
                  type="text"
                  value={user.email ?? ''}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  계급
                </label>
                <select
                  value={form.rank}
                  onChange={(event) => handleFieldChange('rank', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                >
                  <option value="">선택 안함</option>
                  {PROFILE_RANKS.map((rankOption) => (
                    <option key={rankOption} value={rankOption}>
                      {rankOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  입대일
                </label>
                <input
                  type="date"
                  value={form.enlistmentDate}
                  max={todayInputValue}
                  onChange={(event) => handleFieldChange('enlistmentDate', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                />
                {enlistmentDateError && (
                  <p className="text-xs text-red-500">{enlistmentDateError}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                소속부대
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(event) => handleFieldChange('unit', event.target.value)}
                maxLength={50}
                placeholder="예: 육군 제00사단"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
              />
            </div>

            {(saveError || saveSuccess) && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  saveError
                    ? 'border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                }`}
              >
                {saveError || saveSuccess}
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-slate-200/70 pt-6 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                저장 후 헤더 프로필, 커뮤니티 표시 정보, 대시보드 복무 계산 카드에 즉시 반영됩니다.
              </p>
              <button
                type="submit"
                disabled={isSaving || !form.nickname.trim() || !!nicknameError || !!enlistmentDateError}
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#2563eb,#14b8a6)] px-7 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.8)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '개인정보 저장'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
