import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200/50 bg-slate-50 dark:border-slate-800/50 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-center sm:px-6 sm:py-10 md:flex-row md:items-center md:justify-between md:text-left lg:px-8 lg:py-12">
        <div className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
          © {currentYear} Modern Sentinel. All rights reserved.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-end">
          <Link
            className="text-xs text-slate-500 opacity-80 transition-opacity hover:text-blue-600 hover:opacity-100 dark:text-slate-400 dark:hover:text-blue-300"
            to="/terms"
          >
            이용약관
          </Link>
          <Link
            className="text-xs text-slate-500 opacity-80 transition-opacity hover:text-blue-600 hover:opacity-100 dark:text-slate-400 dark:hover:text-blue-300"
            to="/privacy"
          >
            개인정보처리방침
          </Link>
          <Link
            className="text-xs text-slate-500 opacity-80 transition-opacity hover:text-blue-600 hover:opacity-100 dark:text-slate-400 dark:hover:text-blue-300"
            to="/support"
          >
            고객지원
          </Link>
        </div>
      </div>
    </footer>
  );
};
