import React, { useEffect, useMemo, useState } from 'react';

import {
  fetchRecruitmentNotices,
  getSuggestionList,
  hasRecruitmentServiceKey,
  RecruitmentNotice,
} from './recruitmentData';

const itemsPerPage = 8;

const processSteps = [
  {
    id: 'apply',
    icon: 'edit_square',
    title: '지원서 접수',
    description: '공고 확인 후 지원서를 제출하고 모집 조건을 검토합니다.',
  },
  {
    id: 'review',
    icon: 'fact_check',
    title: '접수 현황 확인',
    description: '지원율과 과부족 인원을 기준으로 경쟁 상황을 빠르게 파악합니다.',
  },
  {
    id: 'enlistment',
    icon: 'calendar_month',
    title: '입영 일정 확인',
    description: '입영 시작월, 종료월, 입영년월값을 기준으로 일정 상태를 구분합니다.',
  },
  {
    id: 'status',
    icon: 'military_tech',
    title: '모집 상태 반영',
    description: '접수 종료, 입영 진행, 입영 종료 여부를 현재 날짜 기준으로 표시합니다.',
  },
];

const statusStyles: Record<RecruitmentNotice['status'], string> = {
  '모집 예정': 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  '접수 중': 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
  '접수 종료': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  '입영 진행': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  '입영 종료': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const branchStyles: Record<string, string> = {
  육군: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  해군: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
  공군: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  해병대: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

const getDefaultBranchStyle = () =>
  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

const getSearchableTerms = (notice: RecruitmentNotice) => [
  notice.title,
  notice.branch,
  notice.category,
  notice.specialty,
  notice.unit,
  notice.roundLabel,
  notice.supportRate,
  notice.status,
  ...notice.tags,
];

export const RecruitmentPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState<RecruitmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadRecruitmentNotices = async () => {
      if (!hasRecruitmentServiceKey) {
        setErrorMessage(
          '모병 모집 API 키가 없습니다. frontend 환경변수에 REACT_APP_DATA_SERVICE_KEY를 설정해 주세요.'
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage('');

        const nextNotices = await fetchRecruitmentNotices(controller.signal);
        setNotices(nextNotices);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : '모병 모집 데이터를 불러오지 못했습니다.';
        setErrorMessage(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadRecruitmentNotices();

    return () => {
      controller.abort();
    };
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const suggestions = useMemo(() => getSuggestionList(notices, searchQuery), [notices, searchQuery]);

  const filteredNotices = useMemo(() => {
    const activeQuery = (selectedSuggestion || searchQuery).trim().toLowerCase();

    if (!activeQuery) {
      return notices;
    }

    return notices.filter((notice) =>
      getSearchableTerms(notice).some((term) => term.toLowerCase().includes(activeQuery))
    );
  }, [notices, searchQuery, selectedSuggestion]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / itemsPerPage));
  const visibleNotices = filteredNotices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSuggestion]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  return (
    <div className="w-full">
      <section className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_34%),linear-gradient(135deg,#f8fbff_0%,#eef4ff_44%,#ffffff_100%)] px-6 py-10 shadow-[0_24px_80px_rgba(30,64,175,0.12)] ring-1 ring-blue-100 md:px-10 lg:px-12 lg:py-14 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.26),_transparent_28%),linear-gradient(135deg,#0f172a_0%,#172554_48%,#0f172a_100%)] dark:ring-blue-900/60">
        <div className="absolute -right-16 top-10 h-40 w-40 rounded-full bg-blue-200/45 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-400/10" />

        <div className="relative grid gap-10 lg:grid-cols-[1.35fr_0.95fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.32em] text-blue-700 dark:text-blue-300">
              Recruitment
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 lg:text-6xl dark:text-white">
              모병 모집
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 lg:text-lg dark:text-slate-300">
              병무청 공공데이터를 기준으로 모집 공고를 불러오고, 군구분과 군사특기 중심으로
              정리한 페이지입니다. 접수 기간, 지원율, 과부족, 입영 진행 상태를 한 화면에서
              확인할 수 있습니다.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.1)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                  Search
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  모집 공고 검색
                </h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                총 {notices.length}건
              </span>
            </div>

            <label className="block">
              <span className="sr-only">모집 검색</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-blue-400 focus-within:bg-white dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-blue-400">
                <span
                  className="material-symbols-outlined text-slate-400 dark:text-slate-500"
                  translate="no"
                >
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSelectedSuggestion('');
                  }}
                  placeholder="예: 육군, 전문기술병, 공병, 해병대"
                  className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </label>

            {suggestions.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Related
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => {
                    const isActive = selectedSuggestion === suggestion;

                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setSelectedSuggestion(suggestion);
                          setSearchQuery(suggestion);
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  현재 결과
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {filteredNotices.length}건
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  선택 필터
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {selectedSuggestion || (normalizedQuery ? searchQuery : '전체 보기')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 md:p-8 dark:bg-slate-950 dark:ring-slate-900">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300">
              Open Notices
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              모집 공고 목록
            </h2>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {selectedSuggestion
              ? `${selectedSuggestion} 관련 공고를 보여주고 있습니다.`
              : '군구분코드명과 군사특기명을 기준으로 공고를 탐색할 수 있습니다.'}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
            모병 모집 데이터를 불러오는 중입니다.
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-3xl border border-dashed border-rose-200 bg-rose-50 px-6 py-16 text-center text-sm font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && !errorMessage ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {visibleNotices.map((notice) => (
                <article
                  key={notice.id}
                  className="flex min-h-[370px] flex-col rounded-[26px] border border-slate-100 bg-slate-50 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(37,99,235,0.12)] dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          branchStyles[notice.branch] || getDefaultBranchStyle()
                        }`}
                      >
                        {notice.branch}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {notice.category}
                      </span>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[notice.status]}`}>
                      {notice.status}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {notice.roundLabel}
                    </p>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {notice.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      입영 부대: {notice.unit}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      군사특기: {notice.specialty}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        지원율
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {notice.supportRate}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        과부족
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {notice.pressureGap}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 rounded-2xl bg-white px-4 py-4 text-sm dark:bg-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">접수 인원</span>
                      <span className="text-right font-bold text-slate-900 dark:text-white">
                        {notice.appliedCount ?? '-'} / {notice.selectedCount ?? '-'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">모집 기간</span>
                      <span className="text-right font-medium text-slate-900 dark:text-white">
                        {notice.applicationPeriodLabel}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">입영 기간</span>
                      <span className="text-right font-medium text-slate-900 dark:text-white">
                        {notice.enlistmentPeriodLabel}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">입영년월값</span>
                      <span className="text-right font-medium text-slate-900 dark:text-white">
                        {notice.entryDateLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {notice.tags.slice(0, 3).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedSuggestion(tag);
                          setSearchQuery(tag);
                        }}
                        className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {visibleNotices.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                일치하는 모집 공고가 없습니다. 다른 검색어를 입력하거나 제안을 선택해 보세요.
              </div>
            ) : null}

            {filteredNotices.length > 0 ? (
              <div className="mt-12 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined" translate="no">
                    chevron_left
                  </span>
                </button>
                <div className="text-sm font-bold tracking-[0.24em] text-slate-700 dark:text-slate-200">
                  {currentPage} / {totalPages}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined" translate="no">
                    chevron_right
                  </span>
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="mt-12 rounded-[30px] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_52%,#ecfeff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 md:p-8 dark:bg-[linear-gradient(135deg,#0f172a_0%,#111827_52%,#082f49_100%)] dark:ring-slate-900">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300">
              Process
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              데이터 반영 기준
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            공공데이터 원본 날짜는 현재 시점과 차이가 커서, 페이지에서는 요구사항에 맞게 3년을 더한
            일정으로 표시하고 상태를 계산합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {processSteps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <span className="material-symbols-outlined" translate="no">
                    {step.icon}
                  </span>
                </div>
                <span className="text-sm font-black tracking-[0.2em] text-slate-300 dark:text-slate-700">
                  0{index + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
