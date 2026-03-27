import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, ProfileFormValues } from '../../features/profile/types';
import {
  getTodayInputValue,
  isNicknameAvailable,
  PROFILE_RANKS,
  saveProfile,
} from '../../features/profile/profileFormUtils';

interface ProfileSetupModalProps {
  user: User;
  initialProfile?: Profile | null;
  onProfileCreated: (profile: Profile) => void;
  onSignOut: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  user,
  initialProfile = null,
  onProfileCreated,
  onSignOut,
}) => {
  const [form, setForm] = useState<ProfileFormValues>({
    nickname: initialProfile?.nickname ?? '',
    rank: initialProfile?.rank ?? '',
    unit: initialProfile?.unit ?? '',
    enlistmentDate: initialProfile?.enlistment_date ?? '',
  });
  const [nicknameError, setNicknameError] = useState('');
  const [enlistmentDateError, setEnlistmentDateError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const todayInputValue = getTodayInputValue();

  useEffect(() => {
    setForm({
      nickname: initialProfile?.nickname ?? '',
      rank: initialProfile?.rank ?? '',
      unit: initialProfile?.unit ?? '',
      enlistmentDate: initialProfile?.enlistment_date ?? '',
    });
    setNicknameError('');
    setEnlistmentDateError('');
    setError('');
  }, [initialProfile]);

  const checkNicknameAvailability = async (value: string) => {
    if (!value.trim()) return;
    setIsCheckingNickname(true);
    setNicknameError('');
    const available = await isNicknameAvailable(value, user.id);
    setIsCheckingNickname(false);
    if (!available) {
      setNicknameError('이미 사용 중인 닉네임입니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nickname.trim()) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }
    if (form.enlistmentDate && form.enlistmentDate > todayInputValue) {
      setEnlistmentDateError('입대일은 오늘 이후로 설정할 수 없습니다.');
      return;
    }
    if (nicknameError) return;

    setIsSubmitting(true);
    setError('');
    const { data, error: insertError } = await saveProfile(user.id, form);

    setIsSubmitting(false);
    if (insertError) {
      if (insertError.code === '23505') {
        setNicknameError('이미 사용 중인 닉네임입니다.');
      } else {
        setError('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
      return;
    }
    onProfileCreated(data as Profile);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-sm p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        {/* 헤더 */}
        <div className="mb-6">
          <span className="text-primary font-semibold tracking-wider text-xs mb-1 block">WELCOME</span>
          <h2 className="text-xl font-bold text-on-surface dark:text-white">프로필 설정</h2>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
            서비스 이용을 위해 닉네임을 설정해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 닉네임 */}
          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => {
                setForm((current) => ({ ...current, nickname: e.target.value }));
                setNicknameError('');
              }}
              onBlur={() => checkNicknameAvailability(form.nickname)}
              placeholder="사용할 닉네임을 입력하세요"
              maxLength={20}
              className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white placeholder-slate-400 outline-none"
            />
            {isCheckingNickname && (
              <p className="text-xs text-slate-400 mt-1 ml-1">중복 확인 중...</p>
            )}
            {nicknameError && (
              <p className="text-xs text-red-500 mt-1 ml-1">{nicknameError}</p>
            )}
          </div>

          {/* 계급 */}
          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">
              계급 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <select
              value={form.rank}
              onChange={(e) => setForm((current) => ({ ...current, rank: e.target.value }))}
              className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none appearance-none"
            >
              <option value="">선택 안함</option>
              {PROFILE_RANKS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">
              입대일 <span className="text-slate-400 font-normal">(군 복무 중이라면 입력)</span>
            </label>
            <input
              type="date"
              value={form.enlistmentDate}
              max={todayInputValue}
              onChange={(e) => {
                setForm((current) => ({ ...current, enlistmentDate: e.target.value }));
                setEnlistmentDateError('');
              }}
              className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white outline-none"
            />
            {enlistmentDateError && (
              <p className="text-xs text-red-500 mt-1 ml-1">{enlistmentDateError}</p>
            )}
          </div>

          {/* 소속부대 */}
          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-1 ml-1">
              소속부대 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm((current) => ({ ...current, unit: e.target.value }))}
              placeholder="예: 육군 제00사단"
              maxLength={50}
              className="w-full bg-surface-container-low dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white placeholder-slate-400 outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !!nicknameError || !!enlistmentDateError || !form.nickname.trim()}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? '저장 중...' : '시작하기'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onSignOut}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};
