import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { LoginModal } from '../common/LoginModal';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { MyCouponModal } from '../common/MyCouponModal';
import { CartIcon } from '../../features/cart/components/CartIcon';
import { Profile } from '../common/ProfileSetupModal';

const brandLogoSrc = `${process.env.PUBLIC_URL}/logo.png`;

interface HeaderProps {
  user: User | null;
  profile: Profile | null;
  onSignOut: () => Promise<void> | void;
}

export const Header: React.FC<HeaderProps> = ({ user, profile, onSignOut }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isMyCouponModalOpen, setIsMyCouponModalOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleSignOut = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsDropdownOpen(false);
    await onSignOut();
  };

  const displayName = profile?.nickname
    || (user?.user_metadata?.full_name as string)
    || user?.email
    || '사용자';

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-[0_12px_40px_rgba(27,28,28,0.06)] flex justify-between items-center px-8 h-16 max-w-full transition-colors">
        <NavLink
          to="/"
          className="flex items-center shrink-0"
          aria-label="홈으로 이동"
        >
          <img
            src={brandLogoSrc}
            alt="TeamC service logo"
            className="h-12 w-auto object-contain"
          />
          <span className="sr-only">TeamC</span>
        </NavLink>
        <div className="hidden md:flex items-center space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-['Inter'] text-sm tracking-tight"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            }
          >
            쇼핑
          </NavLink>
          <NavLink
            to="/Dashboard"
            className={({ isActive }) =>
              isActive
                ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-['Inter'] text-sm tracking-tight"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            }
          >
            대시보드
          </NavLink>
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight" href="#">
            동원훈련
          </a>
          <a className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight" href="#">
            모집정보
          </a>
          <NavLink
            to="/Community"
            className={({ isActive }) =>
              isActive
                ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-['Inter'] text-sm tracking-tight"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-['Inter'] text-sm tracking-tight"
            }
          >
            커뮤니티
          </NavLink>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <span
            className="material-symbols-outlined text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-all"
            onClick={() => setIsMyCouponModalOpen(true)}
          >
            confirmation_number
          </span>

          <CartIcon />

          {user ? (
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center justify-center ring-2 ring-blue-500 hover:ring-blue-400 rounded-full transition-all"
                aria-label="프로필 메뉴"
              >
                <ProfileAvatar
                  nickname={displayName}
                  rank={profile?.rank}
                  avatar_url={profile?.avatar_url}
                  containerClassName="w-9 h-9 rounded-full overflow-hidden"
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">로그인됨</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                      {displayName}
                    </p>
                    {profile?.rank && (
                      <p className="text-xs text-primary mt-0.5">{profile.rank}{profile.unit ? ` · ${profile.unit}` : ''}</p>
                    )}
                  </div>
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

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <MyCouponModal isOpen={isMyCouponModalOpen} onClose={() => setIsMyCouponModalOpen(false)} />
    </>
  );
};
