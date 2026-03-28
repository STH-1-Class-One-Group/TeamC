import React from 'react';

interface SignupCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignupCompletionModal: React.FC<SignupCompletionModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm px-6">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.65)] dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_55%)] px-8 pb-6 pt-8 dark:bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_55%)]">
          <span className="inline-flex rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200">
            Welcome
          </span>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            회원가입이 완료되었습니다
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            프로필 설정이 저장되었고 이제 서비스를 바로 이용할 수 있습니다.
          </p>
        </div>

        <div className="space-y-4 px-8 pb-8">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-5 py-5 text-center dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Thank you for your hard work.
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              당신의 노고에 감사합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
