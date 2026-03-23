import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { LoginModal } from '../common/LoginModal';
import { CartIcon } from '../../features/cart/components/CartIcon';

// ── Props 인터페이스 ──────────────────────────────────────────
// App.tsx에서 내려주는 user 정보와 로그아웃 함수를 타입으로 명시
interface HeaderProps {
  user: User | null;       // 로그인 상태면 User 객체, 아니면 null
  onSignOut: () => void;   // 로그아웃 실행 함수
}

export const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 드롭다운 메뉴(로그아웃 버튼) 열림/닫힘 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 드롭다운 외부 클릭 시 닫힘 처리
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // 로그아웃: 함수 실행 후 드롭다운도 닫기
  const handleSignOut = () => {
    setIsDropdownOpen(false);
    onSignOut(); // App.tsx에서 내려온 supabase.auth.signOut()
  };

  // 프로필 이미지: OAuth 제공자에서 받은 avatar_url 사용, 없으면 기본 이니셜
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name as string)
    || user?.email
    || '사용자';
  // 이름 첫 글자를 이니셜로 → 이미지가 없을 때 표시
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-[0_12px_40px_rgba(27,28,28,0.06)] flex justify-between items-center px-8 h-16 max-w-full transition-colors">
        <div className="text-xl font-bold tracking-tighter text-blue-800 dark:text-blue-300">
          Modern Sentinel
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-['Inter'] text-sm tracking-tight"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            }
          >
            Shopping
          </NavLink>
          <NavLink
            to="/Dashboard"
            className={({ isActive }) =>
              isActive
                ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-['Inter'] text-sm tracking-tight"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            }
          >
            Dashboard
          </NavLink>
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight" href="#">
            Armed Reserve
          </a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight" href="#">
            Recruitment
          </a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight" href="#">
            Community
          </a>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* 다크모드 토글 */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all">
            confirmation_number
          </span>

          {/* 장바구니 아이콘 */}
          <CartIcon />

          {/* ── 로그인 상태에 따라 다른 UI 렌더링 ── */}
          {user ? (
            // ✅ 로그인 상태: 프로필 이미지 + 드롭다운
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 외부 클릭 닫힘 방지
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500 hover:ring-blue-400 transition-all"
                aria-label="프로필 메뉴"
              >
                {avatarUrl ? (
                  // OAuth 제공자(구글·카카오 등)에서 받은 프로필 사진
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // 사진 없으면 이름 첫 글자 이니셜
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {initial}
                  </div>
                )}
              </button>

              {/* 드롭다운 메뉴 */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                  {/* 유저 이름 표시 */}
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">로그인됨</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                      {displayName}
                    </p>
                  </div>
                  {/* 로그아웃 버튼 */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ❌ 비로그인 상태: 로그인 버튼
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="로그인"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all">
                account_circle
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* 로그인 모달: 비로그인 상태에서만 의미 있음 */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};
