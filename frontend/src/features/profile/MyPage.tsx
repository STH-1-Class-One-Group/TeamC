import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import {
  calculateServiceTimeline,
  getCadreCategoryLabel,
  getUserTypeLabel,
  isCadreUser,
  isEnlistedUser,
} from '../../utils/serviceDates';
import { Profile } from './types';
import { getProviderLabel } from './profileFormUtils';
import { ProfileEditModal } from './ProfileEditModal';
import { DeleteAccountModal } from './DeleteAccountModal';

interface MyPageProps {
  user: User | null;
  profile: Profile | null;
  isProfileLoading: boolean;
  onProfileUpdated: (profile: Profile) => void;
  onAccountDeleted: () => Promise<void> | void;
}

const formatDateLabel = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatProgress = (value: number) => `${value.toFixed(1)}%`;

export const MyPage: React.FC<MyPageProps> = ({
  user,
  profile,
  isProfileLoading,
  onProfileUpdated,
  onAccountDeleted,
}) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!user && !isProfileLoading) {
      navigate('/');
    }
  }, [user, isProfileLoading, navigate]);

  const providerLabel = getProviderLabel(user?.app_metadata?.provider);
  const serviceTimeline = calculateServiceTimeline({
    userType: profile?.user_type,
    serviceTrack: profile?.service_track,
    enlistmentDate: profile?.enlistment_date,
    cadreCategory: profile?.cadre_category,
    rank: profile?.rank,
    acquaintanceName: profile?.acquaintance_name,
    acquaintanceServiceTrack: profile?.acquaintance_service_track,
    acquaintanceEnlistmentDate: profile?.acquaintance_enlistment_date,
  });

  const displayName =
    profile?.nickname ||
    (user?.user_metadata?.full_name as string) ||
    user?.email ||
    '사용자';

  const identityLabel = useMemo(() => {
    if (!profile?.user_type) {
      return '회원 유형 미설정';
    }

    if (profile.user_type === 'civilian') {
      return profile.acquaintance_name
        ? `일반인 · 지인 ${profile.acquaintance_name} 기준`
        : '일반인';
    }

    if (isEnlistedUser(profile.user_type)) {
      return `현역군인(병) · ${serviceTimeline.displayRankLabel}`;
    }

    return `${getUserTypeLabel(profile.user_type)} · ${getCadreCategoryLabel(profile.cadre_category)}${serviceTimeline.displayRankLabel !== '-' ? ` · ${serviceTimeline.displayRankLabel}` : ''}`;
  }, [
    profile?.acquaintance_name,
    profile?.cadre_category,
    profile?.user_type,
    serviceTimeline.displayRankLabel,
  ]);

  const profileInfoRows = useMemo(() => {
    if (!profile?.user_type) {
      return [];
    }

    if (profile.user_type === 'civilian') {
      return [
        ['회원 유형', getUserTypeLabel(profile.user_type)],
        ['지인 이름', profile.acquaintance_name || '-'],
        ['지인 복무 유형', serviceTimeline.serviceLabel],
        ['지인 현재 계급', serviceTimeline.displayRankLabel],
      ];
    }

    if (isEnlistedUser(profile.user_type)) {
      return [
        ['회원 유형', getUserTypeLabel(profile.user_type)],
        ['복무 유형', serviceTimeline.serviceLabel],
        ['현재 계급', serviceTimeline.displayRankLabel],
        ['소속부대', profile.unit || '-'],
      ];
    }

    if (isCadreUser(profile.user_type)) {
      return [
        ['회원 유형', getUserTypeLabel(profile.user_type)],
        ['간부 유형', getCadreCategoryLabel(profile.cadre_category)],
        ['계급/직급', serviceTimeline.displayRankLabel],
        ['소속부대/기관', profile.unit || '-'],
      ];
    }

    return [];
  }, [profile, serviceTimeline.displayRankLabel, serviceTimeline.serviceLabel]);

  const accountRows = [
    ['로그인 계정', user?.email ?? '이메일 정보 없음'],
    ['로그인 제공자', providerLabel],
    ['가입일', formatDateLabel(user?.created_at)],
  ];

  if (!user) return null;

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        프로필 정보를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[34px] border border-slate-200/70 bg-white/90 shadow-[0_30px_120px_-58px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/85">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                Account
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  마이페이지
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                  필요한 정보만 확인하고, 수정은 별도 창에서 간단하게 진행할 수 있도록 구성했습니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#2563eb,#14b8a6)] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.8)] transition-transform hover:-translate-y-0.5"
                >
                  개인정보 수정
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/Dashboard')}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500/30 dark:hover:text-sky-200"
                >
                  대시보드 보기
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/40"
                >
                  회원 탈퇴
                </button>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200/70 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  nickname={displayName}
                  rank={profile?.rank}
                  avatar_url={profile?.avatar_url}
                  user_type={profile?.user_type}
                  service_track={profile?.service_track}
                  enlistment_date={profile?.enlistment_date}
                  containerClassName="h-20 w-20 overflow-hidden rounded-[24px] ring-4 ring-white dark:ring-slate-900"
                  fallbackClassName="bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-500 text-white text-2xl font-black"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Active Identity
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-bold text-slate-900 dark:text-white">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {identityLabel}
                    {profile?.unit ? ` · ${profile.unit}` : ''}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    현재 상태
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {serviceTimeline.dDayLabel}
                    </div>
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {formatProgress(serviceTimeline.progressPercent)}
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#2563eb,#14b8a6)]"
                      style={{ width: `${serviceTimeline.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_16px_70px_-50px_rgba(15,23,42,0.55)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">프로필 정보</h2>
            <div className="mt-5 space-y-4">
              {profileInfoRows.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_16px_70px_-50px_rgba(15,23,42,0.55)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">복무 정보</h2>
            <div className="mt-5 space-y-4">
              {[
                ['기준 대상', serviceTimeline.subjectLabel],
                ['복무/직군', serviceTimeline.serviceLabel],
                ['현재 계급/직급', serviceTimeline.displayRankLabel],
                ['입대일/임용일', serviceTimeline.enlistmentLabel],
                ['전역일', serviceTimeline.dischargeLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_16px_70px_-50px_rgba(15,23,42,0.55)] dark:border-slate-800/80 dark:bg-slate-900/80">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">계정 정보</h2>
            <div className="mt-5 space-y-4">
              {accountRows.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[28px] border border-red-200/70 bg-[linear-gradient(135deg,rgba(254,242,242,0.95),rgba(255,255,255,0.95))] p-6 shadow-[0_16px_70px_-50px_rgba(127,29,29,0.45)] dark:border-red-900/40 dark:bg-[linear-gradient(135deg,rgba(69,10,10,0.6),rgba(15,23,42,0.88))]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-300">
                Danger Zone
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">회원 탈퇴</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                계정을 삭제하면 프로필, 커뮤니티 활동, 장바구니와 같이 사용자에게 연결된 데이터가 함께 제거되며 복구할 수 없습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#dc2626,#b91c1c)] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(185,28,28,0.75)] transition-transform hover:-translate-y-0.5"
            >
              회원 탈퇴 진행
            </button>
          </div>
        </section>
      </div>

      <ProfileEditModal
        isOpen={isEditModalOpen}
        user={user}
        profile={profile}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={onProfileUpdated}
      />
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        user={user}
        profile={profile}
        onClose={() => setIsDeleteModalOpen(false)}
        onAccountDeleted={onAccountDeleted}
      />
    </>
  );
};
