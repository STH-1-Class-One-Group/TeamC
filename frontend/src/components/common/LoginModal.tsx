import React from 'react';
import { Link } from 'react-router-dom';

import {
  getSupabaseConfigErrorMessage,
  getSupabaseRuntimeErrorMessage,
  hasSupabaseConfig,
  supabase,
} from '../../api/supabaseClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OAuthProvider = 'google' | 'kakao' | 'naver';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  const getRedirectTo = () => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const { origin, pathname, search } = window.location;
    return `${origin}${pathname}${search}`;
  };

  const handleLogin = async (provider: OAuthProvider) => {
    if (!hasSupabaseConfig) {
      alert(getSupabaseConfigErrorMessage());
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as Parameters<typeof supabase.auth.signInWithOAuth>[0]['provider'],
        options: {
          redirectTo: getRedirectTo(),
          ...(provider === 'google'
            ? {
                queryParams: {
                  prompt: 'select_account',
                },
              }
            : {}),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      alert(`로그인 요청 중 문제가 발생했습니다: ${getSupabaseRuntimeErrorMessage(error)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-surface-container-lowest p-8 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface dark:text-white">로그인 / 회원가입</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined translate-y-[2px]">close</span>
          </button>
        </div>

        <p className="mb-8 text-center text-sm text-on-surface-variant dark:text-slate-400">
          Modern Sentinel에 로그인하고
          <br />
          맞춤형 군생활 관리 서비스를 이용해보세요.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleLogin('kakao')}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-4 py-3 font-bold text-[#000000] transition-colors hover:bg-[#FEE500]/90"
          >
            카카오톡으로 계속하기
          </button>

          <button
            onClick={() => handleLogin('naver')}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#03C75A] px-4 py-3 font-bold text-white transition-colors hover:bg-[#03C75A]/90"
          >
            네이버로 계속하기
          </button>

          <button
            onClick={() => handleLogin('google')}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Google로 계속하기
          </button>
        </div>

        <div className="mt-8 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          로그인하면 Modern Sentinel의{' '}
          <Link to="/terms" onClick={onClose} className="underline hover:text-primary">
            이용약관
          </Link>
          {' '}및
          <br />
          <Link to="/privacy" onClick={onClose} className="underline hover:text-primary">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </div>
      </div>
    </div>
  );
};
