import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from './types';
import {
  ACCOUNT_DELETION_CONFIRMATION_TEXT,
  deleteCurrentAccount,
} from './accountApi';

interface DeleteAccountModalProps {
  isOpen: boolean;
  user: User;
  profile: Profile | null;
  onClose: () => void;
  onAccountDeleted: () => Promise<void> | void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  user,
  profile,
  onClose,
  onAccountDeleted,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isRiskAcknowledged, setIsRiskAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const displayName =
    profile?.nickname ||
    (user.user_metadata?.full_name as string) ||
    user.email ||
    '사용자';

  const isConfirmationMatched = useMemo(
    () => confirmationText.trim() === ACCOUNT_DELETION_CONFIRMATION_TEXT,
    [confirmationText]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setConfirmationText('');
    setIsRiskAcknowledged(false);
    setSubmitError('');
  }, [isOpen]);

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

  const handleDeleteAccount = async () => {
    if (!isConfirmationMatched || !isRiskAcknowledged) {
      return;
    }

    setIsDeleting(true);
    setSubmitError('');

    try {
      await deleteCurrentAccount(confirmationText.trim());
      await onAccountDeleted();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';

      setSubmitError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[30px] border border-red-200/70 bg-white shadow-[0_30px_120px_-48px_rgba(127,29,29,0.45)] dark:border-red-900/50 dark:bg-slate-900">
        <div className="border-b border-red-100 bg-red-50/80 px-6 py-5 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-300">
            Danger Zone
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">회원 탈퇴</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            계정을 삭제하면 {displayName}님의 프로필과 연결된 서비스 데이터가 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
          </p>
        </div>

        <div className="space-y-6 px-6 py-6 md:px-8">
          <div className="rounded-[24px] border border-red-200/80 bg-red-50/70 p-5 dark:border-red-900/40 dark:bg-red-950/20">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-200">삭제 전에 확인해주세요</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
              <li>프로필 정보와 마이페이지 설정이 삭제됩니다.</li>
              <li>작성한 커뮤니티 게시글, 댓글, 추천 기록이 함께 삭제될 수 있습니다.</li>
              <li>장바구니, 쿠폰, 북마크 등 사용자별 데이터도 함께 정리됩니다.</li>
              <li>삭제 후에는 동일한 계정으로 다시 로그인해도 기존 데이터가 복구되지 않습니다.</li>
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                삭제 대상 계정
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {displayName}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                로그인 계정
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {user.email ?? '이메일 정보 없음'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              확인 문구 입력
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              계속하려면 <span className="font-bold text-red-600 dark:text-red-300">{ACCOUNT_DELETION_CONFIRMATION_TEXT}</span> 를 정확히 입력해주세요.
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(event) => {
                setConfirmationText(event.target.value);
                setSubmitError('');
              }}
              placeholder={ACCOUNT_DELETION_CONFIRMATION_TEXT}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-red-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-red-500"
            />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
            <input
              type="checkbox"
              checked={isRiskAcknowledged}
              onChange={(event) => {
                setIsRiskAcknowledged(event.target.checked);
                setSubmitError('');
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span>위 내용을 모두 확인했으며, 계정과 연결된 데이터를 삭제하는 데 동의합니다.</span>
          </label>

          {submitError && <p className="text-sm font-medium text-red-600 dark:text-red-300">{submitError}</p>}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200/70 pt-6 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting || !isConfirmationMatched || !isRiskAcknowledged}
              className="rounded-full bg-[linear-gradient(135deg,#dc2626,#b91c1c)] px-6 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(185,28,28,0.8)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? '회원 탈퇴 처리 중...' : '회원 탈퇴'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
