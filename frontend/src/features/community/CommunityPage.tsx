import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

import {
  buildApiUrl,
  getApiResponseErrorMessage,
  getApiRuntimeErrorMessage,
  isNetworkFetchError,
} from '../../api/apiBaseUrl';
import { Profile } from '../profile/types';
import { Post, PostListResponse, formatBoardDate } from './types';

interface CommunityPageProps {
  user: User | null;
  profile: Profile | null;
}

type SearchType = 'title' | 'title_content';

const PAGE_SIZE_OPTIONS = [30, 50, 100] as const;
const PAGE_BLOCK_SIZE = 10;

const CATEGORY_TABS = [
  { key: 'all', label: '전체글' },
  { key: 'general', label: '자유게시판' },
  { key: 'question', label: '질문게시판' },
  { key: 'info', label: '정보공유' },
];

const CATEGORY_LABELS: Record<string, string> = {
  general: '자유게시판',
  question: '질문게시판',
  info: '정보공유',
};

const SEARCH_TYPE_OPTIONS: Array<{ value: SearchType; label: string }> = [
  { value: 'title', label: '제목' },
  { value: 'title_content', label: '제목 + 내용' },
];

export const CommunityPage: React.FC<CommunityPageProps> = ({ user, profile }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(30);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchType, setSearchType] = useState<SearchType>('title');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedOnceRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(
    async (
      category: string,
      currentPage: number,
      currentPageSize: number,
      keyword: string,
      currentSearchType: SearchType,
    ) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const isInitialLoad = !hasLoadedOnceRef.current;

      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError('');

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          per_page: String(currentPageSize),
        });

        if (category !== 'all') {
          params.append('category', category);
        }

        if (keyword) {
          params.append('query', keyword);
          params.append('search_type', currentSearchType);
        }

        const response = await fetch(`${buildApiUrl('/api/v1/community/posts')}?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          let detail = '';

          try {
            const payload = await response.json();
            if (payload && typeof payload.detail === 'string') {
              detail = payload.detail.trim();
            }
          } catch {
            detail = '';
          }

          throw new Error(detail || getApiResponseErrorMessage(response.status, '게시글'));
        }

        const data: PostListResponse = await response.json();
        hasLoadedOnceRef.current = true;
        setPosts(data.posts);
        setTotal(data.total);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        console.error(err);

        if (!hasLoadedOnceRef.current) {
          setPosts([]);
          setTotal(0);
        }

        const message =
          err instanceof Error
            ? err.message
            : isNetworkFetchError(err)
              ? getApiRuntimeErrorMessage('게시글 목록')
              : '게시글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

        setError(message);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchPosts(selectedCategory, page, pageSize, searchKeyword, searchType);
  }, [fetchPosts, page, pageSize, searchKeyword, searchType, selectedCategory]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchKeyword(searchInput.trim());
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setSearchKeyword('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentBlock = Math.floor((page - 1) / PAGE_BLOCK_SIZE);
  const startPage = currentBlock * PAGE_BLOCK_SIZE + 1;
  const endPage = Math.min(totalPages, startPage + PAGE_BLOCK_SIZE - 1);
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  return (
    <div className="w-full">
      <Helmet>
        <title>군인 커뮤니티 | Modern Sentinel</title>
        <meta name="description" content="군 생활, 방산, 예비군 관련 정보를 나누는 커뮤니티입니다." />
        <meta property="og:title" content="군인 커뮤니티 | Modern Sentinel" />
        <meta property="og:description" content="군 생활, 방산, 예비군 관련 정보를 나누는 커뮤니티입니다." />
      </Helmet>

      <section className="mb-10 sm:mb-12">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tighter text-on-surface dark:text-white sm:text-5xl md:text-6xl">
          커뮤니티
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant dark:text-slate-400">
          군 생활과 방산 관련 정보, 경험, 질문을 자유롭게 나누는 공간입니다.
        </p>
      </section>

      <div className="rounded-xl bg-surface-container-low p-4 dark:bg-slate-900 sm:p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleCategoryChange(tab.key)}
                  className={`border px-5 py-2 text-sm font-semibold transition-colors ${
                    selectedCategory === tab.key
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:border-primary/60 dark:bg-slate-800 dark:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:self-end lg:self-auto">
              <label className="flex items-center gap-2 text-sm text-on-surface-variant dark:text-slate-300">
                <span>목록 수</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="min-w-[96px] rounded-md border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-on-surface outline-none focus:border-primary dark:bg-slate-800 dark:text-white"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}개
                    </option>
                  ))}
                </select>
              </label>

              {user && profile ? (
                <button
                  onClick={() => navigate('/Community/write')}
                  className="flex items-center gap-2 bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  글쓰기
                </button>
              ) : null}
            </div>
          </div>

          <div className="text-sm text-on-surface-variant dark:text-slate-400">
            총 <span className="font-semibold text-on-surface dark:text-white">{total.toLocaleString()}</span>건
            {searchKeyword ? (
              <span className="ml-2">
                검색어: <span className="font-semibold text-on-surface dark:text-white">{searchKeyword}</span>
              </span>
            ) : null}
            {isRefreshing ? <span className="ml-2 text-primary">목록을 새로 불러오는 중입니다.</span> : null}
          </div>
        </div>

        {error && posts.length > 0 ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="space-y-3 md:hidden">
          {isLoading && posts.length === 0 ? (
            <div className="rounded-lg border border-outline-variant/25 bg-surface-container-lowest px-4 py-16 text-center text-on-surface-variant dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              게시글을 불러오는 중입니다.
            </div>
          ) : error && posts.length === 0 ? (
            <div className="rounded-lg border border-outline-variant/25 bg-surface-container-lowest px-4 py-16 text-center text-red-500 dark:border-slate-700 dark:bg-slate-800">
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border border-outline-variant/25 bg-surface-container-lowest px-4 py-16 text-center text-on-surface-variant dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              등록된 게시글이 없습니다.
            </div>
          ) : (
            posts.map((post) => {
              const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
              const authorLabel = post.author.rank
                ? `${post.author.rank} ${post.author.nickname}`
                : post.author.nickname;

              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(`/Community/${post.id}`)}
                  className="w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-4 text-left transition-colors hover:border-primary/40 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {categoryLabel}
                    </span>
                    <span className="text-xs text-on-surface-variant dark:text-slate-400">
                      {formatBoardDate(post.created_at)}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold leading-snug text-on-surface dark:text-white">
                    {post.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant dark:text-slate-400">
                    <span>{authorLabel}</span>
                    <span>조회수 {post.views}</span>
                    <span>추천 {post.upvotes}</span>
                    <span>비추천 {post.downvotes}</span>
                    <span>No. {post.post_number}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-outline-variant/25 dark:border-slate-700 md:block">
          <table className="min-w-[840px] w-full table-fixed bg-surface-container-lowest dark:bg-slate-800">
            <thead>
              <tr className="border-b border-outline-variant/20 text-sm text-on-surface-variant dark:border-slate-700 dark:text-slate-400">
                <th className="w-24 px-4 py-4 text-center font-semibold">번호</th>
                <th className="px-4 py-4 text-left font-semibold">제목</th>
                <th className="w-40 px-4 py-4 text-center font-semibold">작성자</th>
                <th className="w-32 px-4 py-4 text-center font-semibold">작성일</th>
                <th className="w-24 px-4 py-4 text-center font-semibold">조회</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-20 text-center text-on-surface-variant dark:text-slate-400">
                    게시글을 불러오는 중입니다.
                  </td>
                </tr>
              ) : error && posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-20 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-20 text-center text-on-surface-variant dark:text-slate-400">
                    게시글이 없습니다.
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
                  const authorLabel = post.author.rank
                    ? `${post.author.rank} ${post.author.nickname}`
                    : post.author.nickname;

                  return (
                    <tr
                      key={post.id}
                      className="border-b border-outline-variant/15 transition-colors hover:bg-surface-container-low dark:border-slate-700 dark:hover:bg-slate-700/80"
                    >
                      <td className="px-4 py-4 text-center text-sm text-on-surface-variant dark:text-slate-300">
                        {post.post_number}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <button
                            onClick={() => navigate(`/Community/${post.id}`)}
                            className="flex w-full items-center gap-3 text-left"
                          >
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              {categoryLabel}
                            </span>
                            <span className="truncate text-sm font-medium text-on-surface transition-colors hover:text-primary dark:text-white md:text-base">
                              {post.title}
                            </span>
                          </button>
                          <div className="flex items-center gap-4 pl-[52px] text-xs text-on-surface-variant dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                              {post.upvotes}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">thumb_down</span>
                              {post.downvotes}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-on-surface dark:text-white">
                        {authorLabel}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-on-surface-variant dark:text-slate-300">
                        {formatBoardDate(post.created_at)}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-on-surface-variant dark:text-slate-300">
                        {post.views}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="border border-outline-variant/30 px-3 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"
            >
              이전
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`min-w-[40px] border px-3 py-2 text-sm font-semibold transition-colors ${
                  pageNumber === page
                    ? 'border-primary bg-primary text-white'
                    : 'border-outline-variant/30 text-on-surface hover:border-primary hover:text-primary dark:text-white'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="border border-outline-variant/30 px-3 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"
            >
              다음
            </button>
          </div>
        ) : null}

        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 flex flex-col items-stretch justify-end gap-3 border-t border-outline-variant/15 pt-6 dark:border-slate-700 md:flex-row md:items-center"
        >
          <select
            value={searchType}
            onChange={(event) => {
              setSearchType(event.target.value as SearchType);
              setPage(1);
            }}
            className="rounded-md border border-outline-variant/40 bg-surface-container-lowest px-3 py-3 text-sm text-on-surface outline-none focus:border-primary dark:bg-slate-800 dark:text-white md:w-40"
          >
            {SEARCH_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="검색어를 입력하세요"
            className="w-full rounded-md border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 md:max-w-md"
          />

          <button
            type="submit"
            className="bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            검색
          </button>

          <button
            type="button"
            onClick={handleResetSearch}
            className="border border-outline-variant/30 px-5 py-3 font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary dark:text-white"
          >
            초기화
          </button>
        </form>
      </div>
    </div>
  );
};
