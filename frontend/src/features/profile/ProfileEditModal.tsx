import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, ProfileFormValues } from './types';
import {
  getCadreRankFieldOptions,
  getTodayInputValue,
  isNicknameAvailable,
  PROFILE_ACQUAINTANCE_SERVICE_TRACK_OPTIONS,
  PROFILE_CADRE_CATEGORY_OPTIONS,
  PROFILE_SERVICE_TRACK_OPTIONS,
  PROFILE_USER_TYPE_OPTIONS,
  saveProfile,
} from './profileFormUtils';
import {
  calculateServiceTimeline,
  getCadreRankFieldLabel,
  isCadreUser,
  isEnlistedUser,
} from '../../utils/serviceDates';
import { getProfileMode } from './profileModes';

interface ProfileEditModalProps {
  isOpen: boolean;
  user: User;
  profile: Profile | null;
  onClose: () => void;
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

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  user,
  profile,
  onClose,
  onProfileUpdated,
}) => {
  const [form, setForm] = useState<ProfileFormValues>(createFormState(profile));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

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
    if (!isOpen) {
      return;
    }

    setForm(createFormState(profile));
    setErrors({});
    setSubmitError('');
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

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
    const available = await isNicknameAvailable(form.nickname, user.id);
    setIsCheckingNickname(false);
    if (!available) {
      setErrors((current) => ({ ...current, nickname: '이미 사용 중인 닉네임입니다.' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const mode = getProfileMode(form.userType);
    const nextErrors =
      mode?.validate(form, todayInputValue) ?? { userType: '회원 유형을 선택해주세요.' };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setSubmitError('');

    try {
      const available = await isNicknameAvailable(form.nickname, user.id);
      if (!available) {
        setErrors((current) => ({ ...current, nickname: '이미 사용 중인 닉네임입니다.' }));
        return;
      }

      if (!mode) {
        return;
      }

      const { data, error } = await saveProfile(user.id, mode.normalize(form));
      if (error) {
        if (error.code === '23505') {
          setErrors((current) => ({ ...current, nickname: '이미 사용 중인 닉네임입니다.' }));
        } else {
          setSubmitError('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
        return;
      }

      onProfileUpdated(data as Profile);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200/70 bg-white shadow-[0_30px_120px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800/80 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Profile Editor
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">개인정보 수정</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 md:px-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">회원 유형 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {PROFILE_USER_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => applyUserType(option.value)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    form.userType === option.value
                      ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {errors.userType && <p className="text-xs text-red-500">{errors.userType}</p>}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">닉네임 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.nickname}
                onChange={(event) => setField('nickname', event.target.value)}
                onBlur={checkNicknameAvailability}
                maxLength={20}
                placeholder="사용할 닉네임을 입력하세요"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
              />
              {isCheckingNickname && <p className="text-xs text-slate-500 dark:text-slate-400">중복 확인 중...</p>}
              {errors.nickname && <p className="text-xs text-red-500">{errors.nickname}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">이메일</label>
              <input
                type="text"
                value={user.email ?? ''}
                readOnly
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              />
            </div>
          </div>

          {form.userType === 'civilian' && (
            <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">지인 복무 정보</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">선택 입력입니다. 입력하면 대시보드에서 해당 지인 기준 진행률을 보여줍니다.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">지인 이름</label>
                  <input
                    type="text"
                    value={form.acquaintanceName}
                    onChange={(event) => setField('acquaintanceName', event.target.value)}
                    maxLength={20}
                    placeholder="예: 김철수"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-sky-500"
                  />
                  {errors.acquaintanceName && <p className="text-xs text-red-500">{errors.acquaintanceName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">지인 복무 유형</label>
                  <select
                    value={form.acquaintanceServiceTrack}
                    onChange={(event) => setField('acquaintanceServiceTrack', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-sky-500"
                  >
                    <option value="">선택하세요</option>
                    {PROFILE_ACQUAINTANCE_SERVICE_TRACK_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} · {option.durationLabel}
                      </option>
                    ))}
                  </select>
                  {errors.acquaintanceServiceTrack && <p className="text-xs text-red-500">{errors.acquaintanceServiceTrack}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">지인 입대일</label>
                  <input
                    type="date"
                    value={form.acquaintanceEnlistmentDate}
                    max={todayInputValue}
                    onChange={(event) => setField('acquaintanceEnlistmentDate', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-sky-500"
                  />
                  {errors.acquaintanceEnlistmentDate && <p className="text-xs text-red-500">{errors.acquaintanceEnlistmentDate}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">지인 현재 계급</label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {serviceTimeline.displayRankLabel}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEnlisted && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">복무 유형 <span className="text-red-500">*</span></label>
                <select
                  value={form.serviceTrack}
                  onChange={(event) => setField('serviceTrack', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                >
                  <option value="">선택하세요</option>
                  {PROFILE_SERVICE_TRACK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} · {option.durationLabel}
                    </option>
                  ))}
                </select>
                {errors.serviceTrack && <p className="text-xs text-red-500">{errors.serviceTrack}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">입대일 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.enlistmentDate}
                  max={todayInputValue}
                  onChange={(event) => setField('enlistmentDate', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                />
                {errors.enlistmentDate && <p className="text-xs text-red-500">{errors.enlistmentDate}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">현재 계급</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {serviceTimeline.displayRankLabel}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">소속부대 <span className="text-slate-400 font-normal">(선택)</span></label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(event) => setField('unit', event.target.value)}
                  maxLength={50}
                  placeholder="예: 육군 제00사단"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {isCadre && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">간부 유형 <span className="text-red-500">*</span></label>
                <select
                  value={form.cadreCategory}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, cadreCategory: event.target.value, rank: '' }));
                    setErrors((current) => ({ ...current, cadreCategory: '', rank: '' }));
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                >
                  <option value="">선택하세요</option>
                  {PROFILE_CADRE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.cadreCategory && <p className="text-xs text-red-500">{errors.cadreCategory}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{getCadreRankFieldLabel(form.cadreCategory)} <span className="text-red-500">*</span></label>
                <select
                  value={form.rank}
                  onChange={(event) => setField('rank', event.target.value)}
                  disabled={!form.cadreCategory}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                >
                  <option value="">선택하세요</option>
                  {cadreRankOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.rank && <p className="text-xs text-red-500">{errors.rank}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">임용일/입대일 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.enlistmentDate}
                  max={todayInputValue}
                  onChange={(event) => setField('enlistmentDate', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                />
                {errors.enlistmentDate && <p className="text-xs text-red-500">{errors.enlistmentDate}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">소속부대/기관 <span className="text-slate-400 font-normal">(선택)</span></label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(event) => setField('unit', event.target.value)}
                  maxLength={50}
                  placeholder="예: 공군 제00비행단 / 국방부"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {submitError && <p className="text-xs text-red-500 text-center">{submitError}</p>}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200/70 pt-6 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving || Object.values(errors).some(Boolean) || !form.nickname.trim()}
              className="rounded-full bg-[linear-gradient(135deg,#0ea5e9,#2563eb,#14b8a6)] px-6 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.8)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
