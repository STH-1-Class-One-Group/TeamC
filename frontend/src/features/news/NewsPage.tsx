import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';

import { supabase } from '../../api/supabaseClient';
import { SearchBar } from '../../components/common/SearchBar';
import {
  createNewsBookmark,
  deleteNewsBookmark,
  fetchNewsBatch,
  fetchNewsBookmarks,
  NewsItemPayload,
} from './newsApi';

interface NewsItem extends NewsItemPayload {
  id?: string;
}

const FALLBACK_THUMBNAIL =
  'https://szpwchwghfsswtdrtrmr.supabase.co/storage/v1/object/public/food-media/thumbnail.png';

const getNewsKey = (news: NewsItem) => news.id || news.link;

const mergeUniqueNews = (existingItems: NewsItem[], nextItems: NewsItem[]) => {
  const seenLinks = new Set(existingItems.map((item) => item.link));
  const mergedItems = [...existingItems];

  nextItems.forEach((item) => {
    if (!item.link || seenLinks.has(item.link)) {
      return;
    }

    seenLinks.add(item.link);
    mergedItems.push(item);
  });

  return mergedItems;
};

const getSafeNewsText = (value: unknown) => (typeof value === 'string' ? value : '');

export const NewsPage: React.FC = () => {
  const newsRequestSeqRef = useRef(0);
  const [user, setUser] = useState<User | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [pendingBookmarkKeys, setPendingBookmarkKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarkFeedback, setBookmarkFeedback] = useState('');

  const itemsPerPage = 8;
  const newsTargetCount = 30;
  const initialBatchSize = 4;
  const followupBatchSize = 4;

  useEffect(() => {
    let isMounted = true;

    const syncUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(currentUser);
      }
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestSeq = newsRequestSeqRef.current + 1;
    newsRequestSeqRef.current = requestSeq;

    const isLatestRequest = () =>
      newsRequestSeqRef.current === requestSeq && !controller.signal.aborted;

    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setIsLoadingMore(false);
        setAllNews([]);

        const loadBatch = async (start: number, batchSize: number) => {
          try {
            const response = await fetchNewsBatch(batchSize, start, {
              forceRefresh: false,
              signal: controller.signal,
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch news batch at start=${start}`);
            }

            const payload = (await response.json()) as NewsItem[];
            console.log(
              `[NewsPage] batch start=${start} size=${batchSize}`,
              payload.map((item) => ({
                title: item.title,
                thumbnail: item.thumbnail,
              }))
            );
            return payload.filter((item) => Boolean(item.link));
          } catch (error) {
            if (controller.signal.aborted) {
              return [];
            }
            console.error(`[NewsPage] failed to load news batch at start=${start}:`, error);
            return [];
          }
        };

        const loadRemainingBatches = async (currentCount: number) => {
          if (isLatestRequest()) {
            setIsLoadingMore(true);
          }

          try {
            let nextStart = currentCount + 1;

            while (nextStart <= newsTargetCount && isLatestRequest()) {
              const remainingCount = newsTargetCount - nextStart + 1;
              const batchSize = Math.min(followupBatchSize, remainingCount);
              const data = await loadBatch(nextStart, batchSize);

              if (data.length === 0) {
                break;
              }

              if (isLatestRequest()) {
                setAllNews((prev) => mergeUniqueNews(prev, data));
              }

              nextStart += data.length;

              if (data.length < batchSize) {
                break;
              }
            }
          } finally {
            if (isLatestRequest()) {
              setIsLoadingMore(false);
            }
          }
        };

        const firstBatchSize = Math.min(initialBatchSize, newsTargetCount);
        const firstBatch = await loadBatch(1, firstBatchSize);

        if (!isLatestRequest()) {
          return;
        }

        const initialNews = mergeUniqueNews([], firstBatch);
        setAllNews(initialNews);
        console.log(
          '[NewsPage] initial state applied',
          initialNews.map((item) => ({
            title: item.title,
            thumbnail: item.thumbnail,
          }))
        );
        setIsLoading(false);

        if (initialNews.length === 0 || initialNews.length >= newsTargetCount || firstBatch.length < firstBatchSize) {
          return;
        }

        void loadRemainingBatches(initialNews.length);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('[NewsPage] failed to load news:', error);
      } finally {
        if (isLatestRequest()) {
          setIsLoading(false);
        }
      }
    };

    void fetchNews();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadBookmarks = async () => {
      if (!user) {
        setBookmarkIds(new Set());
        setIsBookmarkLoading(false);
        return;
      }

      try {
        setIsBookmarkLoading(true);
        const response = await fetchNewsBookmarks({ signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to fetch bookmarks');
        }

        const data: Array<{ newsId: string }> = await response.json();
        if (isMounted) {
          setBookmarkIds(new Set(data.map((item) => item.newsId)));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('[NewsPage] failed to load bookmarks:', error);
        }
      } finally {
        if (isMounted) {
          setIsBookmarkLoading(false);
        }
      }
    };

    void loadBookmarks();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showBookmarksOnly]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const baseNewsList = useMemo(() => {
    if (!showBookmarksOnly) {
      return allNews;
    }

    return allNews.filter((news) => Boolean(news.id && bookmarkIds.has(news.id)));
  }, [allNews, bookmarkIds, showBookmarksOnly]);

  const filteredNews = useMemo(() => {
    if (!normalizedSearchQuery) {
      return baseNewsList;
    }

    return baseNewsList.filter((news) => {
      const title = getSafeNewsText(news.title).toLowerCase();
      const pubDate = getSafeNewsText(news.pubDate).toLowerCase();
      return title.includes(normalizedSearchQuery) || pubDate.includes(normalizedSearchQuery);
    });
  }, [baseNewsList, normalizedSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, startIndex + itemsPerPage);
  const renderNews =
    currentNews.length > 0
      ? currentNews
      : !normalizedSearchQuery && !showBookmarksOnly && allNews.length > 0
        ? allNews.slice(0, itemsPerPage)
        : [];
  const shouldShowLoading = isLoading && allNews.length === 0;
  const debugStateLabel =
    process.env.NODE_ENV !== 'production'
      ? `news:${allNews.length} filtered:${filteredNews.length} visible:${renderNews.length} loading:${String(isLoading)}`
      : '';

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handleBookmarkToggle = async (
    event: React.MouseEvent<HTMLButtonElement>,
    news: NewsItem
  ) => {
    event.stopPropagation();

    if (!user) {
      setBookmarkFeedback('북마크를 저장하려면 로그인하세요.');
      return;
    }

    const bookmarkKey = getNewsKey(news);
    const existingNewsId = news.id;
    const isBookmarked = Boolean(existingNewsId && bookmarkIds.has(existingNewsId));

    setBookmarkFeedback('');
    setPendingBookmarkKeys((prev) => {
      const next = new Set(prev);
      next.add(bookmarkKey);
      return next;
    });

    if (existingNewsId) {
      setBookmarkIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) {
          next.delete(existingNewsId);
        } else {
          next.add(existingNewsId);
        }
        return next;
      });
    }

    try {
      const response = isBookmarked
        ? await deleteNewsBookmark(existingNewsId as string)
        : await createNewsBookmark(news);

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      if (!isBookmarked) {
        const data: { newsId: string } = await response.json();
        const resolvedNewsId = data.newsId || existingNewsId;

        if (resolvedNewsId) {
          setBookmarkIds((prev) => {
            const next = new Set(prev);
            next.add(resolvedNewsId);
            return next;
          });

          if (resolvedNewsId !== news.id) {
            setAllNews((prev) =>
              prev.map((item) =>
                item.link === news.link
                  ? {
                      ...item,
                      id: resolvedNewsId,
                    }
                  : item
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('[NewsPage] failed to toggle bookmark:', error);
      setBookmarkFeedback('북마크 업데이트에 실패했습니다. 다시 시도해 주세요.');

      if (existingNewsId) {
        setBookmarkIds((prev) => {
          const next = new Set(prev);
          if (isBookmarked) {
            next.add(existingNewsId);
          } else {
            next.delete(existingNewsId);
          }
          return next;
        });
      }
    } finally {
      setPendingBookmarkKeys((prev) => {
        const next = new Set(prev);
        next.delete(bookmarkKey);
        return next;
      });
    }
  };

  return (
    <div className="w-full">
      <header className="mb-12 flex flex-col items-center justify-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface dark:text-white lg:text-4xl">
          국방 뉴스 <span className="text-primary dark:text-blue-400">아카이브</span>
        </h1>
        <p className="max-w-2xl text-center text-sm font-medium text-on-surface-variant dark:text-slate-400">
          최신 국방 뉴스 30개를 확인하고 북마크에 저장해 보세요.
        </p>
      </header>

      <section className="mx-auto mb-10 max-w-3xl">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              searchType="news"
              placeholder="뉴스 제목이나 날짜로 검색"
              localItems={allNews}
              searchKeys={['title', 'pubDate']}
              maxResults={6}
              onQueryChange={setSearchQuery}
              onSearchSelect={(item) => {
                if (item?.title) {
                  setSearchQuery(item.title);
                }
              }}
              renderItem={(item) => (
                <div>
                  <div className="line-clamp-2 text-sm font-bold text-on-surface dark:text-white">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs text-on-surface-variant dark:text-slate-400">
                    {item.pubDate}
                  </div>
                </div>
              )}
            />
          </div>
          <button
            type="button"
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
              showBookmarksOnly
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'
            }`}
            onClick={() => setShowBookmarksOnly((prev) => !prev)}
            aria-label="북마크한 뉴스만 보기"
            title={user ? '북마크한 뉴스만 보기' : '북마크 기능을 사용하려면 로그인하세요.'}
          >
            <span
              className="material-symbols-outlined text-3xl"
              style={{
                fontVariationSettings: `'FILL' ${showBookmarksOnly ? 1 : 0}`,
              }}
              translate="no"
            >
              bookmark
            </span>
          </button>
        </div>
        {bookmarkFeedback ? (
          <p className="mt-3 text-sm font-medium text-error dark:text-red-300">{bookmarkFeedback}</p>
        ) : null}
      </section>

      <div className="rounded-xl border border-transparent bg-surface-container-lowest p-8 shadow-[0_12px_40px_rgba(27,28,28,0.06)] transition-all dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-on-surface dark:text-white">
            <span
              className="material-symbols-outlined text-primary dark:text-blue-400"
              translate="no"
            >
              breaking_news
            </span>
            최신 뉴스
          </h2>
          <div className="text-right">
            <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">
              {showBookmarksOnly
                ? `북마크 ${filteredNews.length}`
                : normalizedSearchQuery
                  ? `${filteredNews.length}개의 결과`
                  : `전체 ${allNews.length}`}
            </span>
            {isBookmarkLoading ? (
              <div className="mt-1 text-xs text-on-surface-variant dark:text-slate-500">
                북마크 동기화 중...
              </div>
            ) : null}
          </div>
        </div>
        {debugStateLabel ? (
          <div className="mb-4 rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant dark:bg-slate-800 dark:text-slate-400">
            {debugStateLabel}
          </div>
        ) : null}

        <div
          className={`grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4 ${
            !shouldShowLoading && renderNews.length > 0 && renderNews.length <= 4 ? '' : 'min-h-[400px]'
          }`}
        >
          {renderNews.length > 0 ? (
            renderNews.map((news) => {
              const proxyUrl =
                news.thumbnail && news.thumbnail !== 'https://via.placeholder.com/300x200?text=No+Image'
                  ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/news/image?url=${encodeURIComponent(news.thumbnail)}`
                  : FALLBACK_THUMBNAIL;
              const bookmarkKey = getNewsKey(news);
              const isPending = pendingBookmarkKeys.has(bookmarkKey);
              const isBookmarked = Boolean(news.id && bookmarkIds.has(news.id));

              return (
                <article
                  key={bookmarkKey}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900"
                  onClick={() => window.open(news.link, '_blank', 'noopener,noreferrer')}
                >
                  <div className="aspect-video w-full overflow-hidden bg-surface-dim dark:bg-slate-800">
                    <img
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={proxyUrl}
                      alt={news.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src = FALLBACK_THUMBNAIL;
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-3 text-xs font-medium text-on-surface-variant dark:text-slate-500">
                      {getSafeNewsText(news.pubDate)}
                    </p>
                    <h3 className="mb-6 line-clamp-3 text-base font-bold leading-snug text-on-surface transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-blue-400">
                      {getSafeNewsText(news.title)}
                    </h3>
                    <div className="mt-auto flex items-center justify-end border-t border-outline-variant/15 pt-4 dark:border-slate-800">
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-full p-2 transition-colors ${
                          isBookmarked
                            ? 'text-primary dark:text-blue-400'
                            : 'text-on-surface-variant hover:text-primary dark:text-slate-400 dark:hover:text-blue-400'
                        } ${isPending ? 'opacity-60' : ''}`}
                        onClick={(event) => void handleBookmarkToggle(event, news)}
                        disabled={isPending}
                        aria-label={isBookmarked ? '북마크 제거' : '북마크 저장'}
                      >
                        <span
                          className="material-symbols-outlined text-xl"
                          style={{
                            fontVariationSettings: `'FILL' ${isBookmarked ? 1 : 0}`,
                          }}
                          translate="no"
                        >
                          bookmark
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : shouldShowLoading ? (
            <div className="col-span-full flex items-center justify-center">
              <span className="font-medium text-on-surface-variant dark:text-slate-400">
                뉴스 불러오는 중...
              </span>
            </div>
          ) : (
            <div className="col-span-full flex items-center justify-center font-medium text-on-surface-variant dark:text-slate-400">
              {showBookmarksOnly ? '북마크한 뉴스가 없습니다.' : '일치하는 뉴스가 없습니다.'}
            </div>
          )}
        </div>

        {isLoadingMore && renderNews.length > 0 ? (
          <div className="mt-8 flex justify-center">
            <span className="text-sm text-on-surface-variant dark:text-slate-400">
              뉴스를 더 불러오는 중...
            </span>
          </div>
        ) : null}

        {filteredNews.length > 0 ? (
          <div className="mt-12 flex items-center justify-center space-x-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined" translate="no">
                chevron_left
              </span>
            </button>
            <span className="text-sm font-bold tracking-widest text-on-surface dark:text-white">
              {currentPage} <span className="mx-1 text-on-surface-variant/50">/</span> {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined" translate="no">
                chevron_right
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
