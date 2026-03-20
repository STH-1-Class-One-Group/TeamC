import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 max-w-7xl mx-auto">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-['Inter'] mb-4 md:mb-0">
          © 2024 Modern Sentinel Military Services. All rights reserved.
        </div>
        <div className="flex gap-8">
          <a
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-opacity opacity-80 hover:opacity-100 text-xs"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-opacity opacity-80 hover:opacity-100 text-xs"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-opacity opacity-80 hover:opacity-100 text-xs"
            href="#"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};
