import React, { useState, useEffect } from 'react';
import { LoginModal } from '../common/LoginModal';

export const Header: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // 초기 상태 설정: 로컬 스토리지 확인 또는 시스템 설정 확인
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-[0_12px_40px_rgba(27,28,28,0.06)] flex justify-between items-center px-8 h-16 max-w-full transition-colors">
        <div className="text-xl font-bold tracking-tighter text-blue-800 dark:text-blue-300">
          Modern Sentinel
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            href="#"
          >
            Shopping
            
          </a>
          <a
            className="text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-['Inter'] text-sm tracking-tight"
            href="#"
          >
            Dashboard
          </a>
          <a
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            href="#"
          >
            Armed Reserve
          </a>
          <a
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            href="#"
          >
            Recruitment
          </a>
          <a
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            href="#"
          >
            Community
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            <span
              className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all"
            >
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <span
            className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all"
          >
            confirmation_number
          </span>
          <span
            className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all"
          >
            shopping_cart
          </span>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Login Modal"
          >
            <span
              className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all"
            >
              account_circle
            </span>
          </button>
        </div>
      </nav>
      {/* 로그인 모달 */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
