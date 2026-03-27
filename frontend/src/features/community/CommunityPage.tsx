import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Profile } from '../../components/common/ProfileSetupModal';
import { CATEGORIES, Post, PostListResponse, formatBoardDate } from './types';

interface CommunityPageProps {
  user: User | null;
  profile: Profile | null;
}

type SearchType = 'title' | 'title_content';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PAGE_SIZE_OPTIONS = [30, 50, 100] as const;
const PAGE_BLOCK_SIZE = 10;

const CATEGORY_TABS = [
  { key: 'all', label: '전체글' },
  { key: 'general', label: '자유게시판' },
  { key: 'question', label: '질문게시판' },
  { key: 'info', label: '정보공유' },
];

const SEARCH_TYPE_OPTIONS: Array<{ value: SearchType; label: string }> = [
  { value: 'title', label: '제목' },
  { value: 'title_content', label: '제목+내용' },
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

  const fetchPosts = useCallback(async (
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

      const res = await fetch(`${apiUrl}/api/v1/community/posts?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error('게시글을 불러오지 못했습니다.');
      }

      const data: PostListResponse = await res.json();
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
      setError('게시글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPosts(selectedCategory, page, pageSize, searchKeyword, searchType);
  }, [selectedCategory, page, pageSize, searchKeyword, searchType, fetchPosts]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
    <div>
      <section className="mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 text-on-surface dark:text-white">
          커뮤니티
        </h1>
        <p className="text-on-surface-variant dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
          군 생활의 정보와 경험을 자유롭게 나누는 공간입니다.
        </p>
      </section>

      <div className="bg-surface-container-low dark:bg-slate-900 rounded-xl p-6 md:p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleCategoryChange(tab.key)}
                  className={`px-5 py-2 border text-sm font-semibold transition-colors ${
                    selectedCategory === tab.key
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant/40 bg-surface-container-lowest dark:bg-slate-800 text-on-surface dark:text-white hover:border-primary/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 self-end lg:self-auto">
              <label className="flex items-center gap-2 text-sm text-on-surface-variant dark:text-slate-300">
                <span>목록 수</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="min-w-[96px] rounded-md border border-outline-variant/40 bg-surface-container-lowest dark:bg-slate-800 px-3 py-2 text-on-surface dark:text-white outline-none focus:border-primary"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}개
                    </option>
                  ))}
                </select>
              </label>

              {user && profile && (
                <button
                  onClick={() => navigate('/Community/write')}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 font-semibold hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  글쓰기
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-on-surface-variant dark:text-slate-400">
            총 <span className="font-semibold text-on-surface dark:text-white">{total.toLocaleString()}</span>건
            {searchKeyword && (
              <span className="ml-2">
                · 검색어: <span className="font-semibold text-on-surface dark:text-white">{searchKeyword}</span>
              </span>
            )}
            {isRefreshing && (
              <span className="ml-2 text-primary">· 목록 업데이트 중...</span>
            )}
          </div>
        </div>

        {error && posts.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-outline-variant/25 dark:border-slate-700">
          <table className="min-w-[840px] w-full table-fixed bg-surface-container-lowest dark:bg-slate-800">
            <thead>
              <tr className="border-b border-outline-variant/20 dark:border-slate-700 text-sm text-on-surface-variant dark:text-slate-400">
                <th className="w-24 px-4 py-4 text-center font-semibold">번호</th>
                <th className="px-4 py-4 text-left font-semibold">제목</th>
                <th className="w-40 px-4 py-4 text-center font-semibold">글쓴이</th>
                <th className="w-32 px-4 py-4 text-center font-semibold">작성일</th>
                <th className="w-24 px-4 py-4 text-center font-semibold">조회</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-20 text-center text-on-surface-variant dark:text-slate-400">
                    불러오는 중...
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
                  const categoryLabel = CATEGORIES[post.category] || post.category;
                  const authorLabel = post.author.rank
                    ? `${post.author.rank} ${post.author.nickname}`
                    : post.author.nickname;

                  return (
                    <tr
                      key={post.id}
                      className="border-b border-outline-variant/15 dark:border-slate-700 hover:bg-surface-container-low dark:hover:bg-slate-700/80 transition-colors"
                    >
                      <td className="px-4 py-4 text-center text-sm text-on-surface-variant dark:text-slate-300">
                        {post.post_number}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <button
                            onClick={() => navigate(`/Community/${post.id}`)}
                            className="flex items-center gap-3 w-full text-left"
                          >
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              {categoryLabel}
                            </span>
                            <span className="truncate text-sm md:text-base font-medium text-on-surface dark:text-white hover:text-primary transition-colors">
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-outline-variant/30 text-sm text-on-surface-variant dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            >
              이전
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`min-w-[40px] px-3 py-2 border text-sm font-semibold transition-colors ${
                  pageNumber === page
                    ? 'border-primary bg-primary text-white'
                    : 'border-outline-variant/30 text-on-surface dark:text-white hover:border-primary hover:text-primary'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-outline-variant/30 text-sm text-on-surface-variant dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            >
              다음
            </button>
          </div>
        )}

        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 pt-6 border-t border-outline-variant/15 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3"
        >
          <select
            value={searchType}
            onChange={(event) => {
              setSearchType(event.target.value as SearchType);
              setPage(1);
            }}
            className="md:w-40 rounded-md border border-outline-variant/40 bg-surface-container-lowest dark:bg-slate-800 px-3 py-3 text-sm text-on-surface dark:text-white outline-none focus:border-primary"
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
            className="w-full md:max-w-md rounded-md border border-outline-variant/40 bg-surface-container-lowest dark:bg-slate-800 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-slate-500 outline-none focus:border-primary"
          />

          <button
            type="submit"
            className="px-5 py-3 bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            검색
          </button>

          <button
            type="button"
            onClick={handleResetSearch}
            className="px-5 py-3 border border-outline-variant/30 text-on-surface dark:text-white font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            초기화
          </button>
        </form>
      </div>
    </div>
  );
};
