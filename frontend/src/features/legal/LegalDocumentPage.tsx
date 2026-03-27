import React from 'react';
import { Link } from 'react-router-dom';

type LegalSection = {
  title: string;
  body: readonly string[];
  bullets?: readonly string[];
};

type LegalMeta = {
  label: string;
  value: string;
};

interface LegalDocumentPageProps {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: readonly LegalSection[];
  meta: readonly LegalMeta[];
}

const quickLinks = [
  { to: '/terms', label: '이용약관' },
  { to: '/privacy', label: '개인정보처리방침' },
  { to: '/support', label: '고객지원' },
];

export const LegalDocumentPage: React.FC<LegalDocumentPageProps> = ({
  eyebrow,
  title,
  description,
  lastUpdated,
  sections,
  meta,
}) => {
  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.14),_transparent_36%)]" />

      <section className="mb-10 overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 shadow-[0_24px_90px_-48px_rgba(15,23,42,0.5)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              {eyebrow}
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                {description}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Quick Links
            </div>
            <div className="mt-4 space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded-2xl border border-transparent bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500/30 dark:hover:text-sky-200"
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-6 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Document Info
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Last Updated
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {lastUpdated}
                </div>
              </div>

              {meta.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_16px_60px_-44px_rgba(15,23,42,0.5)] dark:border-slate-800/80 dark:bg-slate-900/80 md:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {section.title}
                </h2>
              </div>

              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-[15px]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.bullets && (
                  <ul className="space-y-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/60">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
