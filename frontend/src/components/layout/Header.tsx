import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

import { LoginModal } from '../common/LoginModal';
import { MyCouponModal } from '../common/MyCouponModal';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { Profile } from '../common/ProfileSetupModal';
import { CartIcon } from '../../features/cart/components/CartIcon';
import { useCart } from '../../features/cart/hooks/useCart';

const brandLogoSrc = `${process.env.PUBLIC_URL}/logo.png`;

interface HeaderProps {
  user: User | null;
  profile: Profile | null;
  onSignOut: () => Promise<void> | void;
}

const navItems = [
  { to: '/', label: '쇼핑' },
  { to: '/Dashboard', label: '대시보드' },
  { to: '/armed-reseve', label: '예비군' },
  { to: '/recruitment', label: '모집정보' },
  { to: '/Community', label: '커뮤니티' },
];

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "border-b-2 border-blue-600 pb-1 font-['Inter'] text-sm tracking-tight text-blue-700 dark:border-blue-400 dark:text-blue-400"
    : "font-['Inter'] text-sm tracking-tight text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300";

const mobileDrawerLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-primary text-white shadow-lg shadow-primary/20'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
  }`;

export const Header: React.FC<HeaderProps> = ({ user, profile, onSignOut }) => {
  const location = useLocation();
  const { openCart, totalCount } = useCart();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (
        savedTheme === 'dark' ||
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }

    return false;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMyCouponModalOpen, setIsMyCouponModalOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

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
    if (!isDropdownOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isActionsMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionsMenuOpen]);

  useEffect(() => {
    setIsDropdownOpen(false);
    setIsNavDrawerOpen(false);
    setIsActionsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isNavDrawerOpen && !isActionsMenuOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActionsMenuOpen, isNavDrawerOpen]);

  const displayName =
    profile?.nickname || (user?.user_metadata?.full_name as string) || user?.email || 'Guest';

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const runSignOut = async () => {
    setIsDropdownOpen(false);
    setIsNavDrawerOpen(false);
    setIsActionsMenuOpen(false);
    await onSignOut();
  };

  const openCoupons = () => {
    setIsMyCouponModalOpen(true);
    setIsActionsMenuOpen(false);
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsNavDrawerOpen(false);
    setIsActionsMenuOpen(false);
  };

  const openCartDrawer = () => {
    openCart();
    setIsActionsMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 z-50 flex h-16 w-full max-w-full items-center justify-between bg-white/80 px-3 shadow-[0_12px_40px_rgba(27,28,28,0.06)] backdrop-blur-lg transition-colors dark:bg-slate-900/80 sm:px-4 lg:h-[72px] lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsNavDrawerOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="메뉴 열기"
            aria-expanded={isNavDrawerOpen}
          >
            <span className="material-symbols-outlined" translate="no">
              {isNavDrawerOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        <NavLink
          to="/"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center lg:hidden"
          aria-label="홈으로 이동"
        >
          <span className="text-sm font-bold tracking-tight text-primary dark:text-blue-300 sm:text-base">
            Modern Sentinel
          </span>
        </NavLink>

        <NavLink to="/" className="hidden shrink-0 items-center lg:flex" aria-label="홈으로 이동">
          <img src={brandLogoSrc} alt="TeamC service logo" className="h-12 w-auto object-contain" />
          <span className="sr-only">TeamC</span>
        </NavLink>

        <div className="hidden items-center space-x-8 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClassName}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <div className="hidden items-center gap-1 md:flex">
            <button
              onClick={toggleDarkMode}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              <span className="material-symbols-outlined cursor-pointer text-slate-500 transition-all hover:text-blue-600 dark:text-slate-400">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={openCoupons}
              aria-label="쿠폰 보기"
            >
              <span className="material-symbols-outlined cursor-pointer text-slate-500 transition-all hover:text-blue-600 dark:text-slate-400">
                confirmation_number
              </span>
            </button>

            <CartIcon />

            {user ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsDropdownOpen((prev) => !prev);
                  }}
                  className="flex items-center justify-center rounded-full ring-2 ring-blue-500 transition-all hover:ring-blue-400"
                  aria-label="프로필 메뉴"
                >
                  <ProfileAvatar
                    nickname={displayName}
                    rank={profile?.rank}
                    avatar_url={profile?.avatar_url}
                    containerClassName="h-9 w-9 overflow-hidden rounded-full"
                  />
                </button>

                {isDropdownOpen ? (
                  <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">로그인됨</p>
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                        {displayName}
                      </p>
                      {profile?.rank ? (
                        <p className="mt-0.5 text-xs text-primary">
                          {profile.rank}
                          {profile.unit ? ` 쨌 ${profile.unit}` : ''}
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => void runSignOut()}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      로그아웃
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="로그인"
              >
                <span className="material-symbols-outlined cursor-pointer text-slate-500 transition-all hover:text-blue-600 dark:text-slate-400">
                  account_circle
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsActionsMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label="설정 메뉴"
            aria-expanded={isActionsMenuOpen}
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300" translate="no">
              more_vert
            </span>
          </button>
        </div>
      </nav>

      {isNavDrawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setIsNavDrawerOpen(false)}
            aria-label="메뉴 닫기"
          />
          <aside className="relative z-10 flex h-full w-[min(84vw,20rem)] flex-col bg-white px-4 pb-6 pt-5 shadow-2xl dark:bg-slate-950 sm:px-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-bold tracking-[0.24em] text-primary dark:text-blue-300">
                NAVIGATION
              </span>
              <button
                type="button"
                onClick={() => setIsNavDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined" translate="no">
                  close
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={mobileDrawerLinkClassName}>
                  <span>{item.label}</span>
                  <span className="material-symbols-outlined text-base" translate="no">
                    chevron_right
                  </span>
                </NavLink>
              ))}
            </div>

            <div className="mt-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Account
              </p>
              <p className="mt-2 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user ? displayName : 'Guest'}
              </p>
              <button
                type="button"
                onClick={user ? () => void runSignOut() : openLoginModal}
                className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {user ? '로그아웃' : '로그인'}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {isActionsMenuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/20"
            onClick={() => setIsActionsMenuOpen(false)}
            aria-label="설정 메뉴 닫기"
          />
          <div
            ref={actionsMenuRef}
            className="absolute right-3 top-[4.5rem] w-[min(88vw,18rem)] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:right-4"
          >
            <div className="mb-2 px-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Quick Settings
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user ? displayName : 'Guest'}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]" translate="no">
                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                  </span>
                  Theme
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isDarkMode ? 'Light' : 'Dark'}
                </span>
              </button>

              <button
                type="button"
                onClick={openCoupons}
                className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]" translate="no">
                    confirmation_number
                  </span>
                  Coupons
                </span>
                <span className="material-symbols-outlined text-base text-slate-400" translate="no">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={openCartDrawer}
                className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]" translate="no">
                    shopping_cart
                  </span>
                  Cart
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{totalCount}</span>
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => void runSignOut()}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]" translate="no">
                      logout
                    </span>
                    Logout
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]" translate="no">
                      account_circle
                    </span>
                    Login
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <MyCouponModal isOpen={isMyCouponModalOpen} onClose={() => setIsMyCouponModalOpen(false)} />
    </>
  );
};
