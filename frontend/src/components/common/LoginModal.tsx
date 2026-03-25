import React from 'react';
import { supabase } from '../../api/supabaseClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OAuthProvider = 'google' | 'kakao' | 'naver';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLogin = async (provider: OAuthProvider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider:
          provider as Parameters<typeof supabase.auth.signInWithOAuth>[0]['provider'],
        options:
          provider === 'google'
            ? {
                queryParams: {
                  prompt: 'select_account',
                },
              }
            : undefined,
      });
      if (error) throw error;
    } catch (error: any) {
      alert(`로그인 요청 중 문제가 발생했습니다: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-surface-container-lowest dark:bg-slate-900 w-full max-w-sm p-8 rounded-2xl shadow-xl transform transition-all border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-on-surface dark:text-white">로그인 / 회원가입</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined translate-y-[2px]">close</span>
          </button>
        </div>
        
        <p className="text-sm text-on-surface-variant dark:text-slate-400 mb-8 text-center">
          Modern Sentinel에 로그인하여 <br/>
          맞춤형 군 생활 관리 서비스를 이용해보세요.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleLogin('kakao')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#FEE500] text-[#000000] font-bold hover:bg-[#FEE500]/90 transition-colors"
          >
            카카오톡으로 계속하기
          </button>
          
          <button
            onClick={() => handleLogin('naver')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#03C75A] text-white font-bold hover:bg-[#03C75A]/90 transition-colors"
          >
            네이버로 계속하기
          </button>

          <button
            onClick={() => handleLogin('google')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-slate-700 border border-slate-300 font-bold hover:bg-slate-50 transition-colors"
          >
            Google로 계속하기
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          로그인 시 Modern Sentinel의 <a href="#" className="underline hover:text-primary">이용약관</a> 및 <br/>
          <a href="#" className="underline hover:text-primary">개인정보처리방침</a>에 동의하게 됩니다.
        </div>
      </div>
    </div>
  );
};
