import React, { useEffect, useState } from 'react';
import { SearchBar } from '../../components/common/SearchBar';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
}

export const NewsPage: React.FC = () => {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const itemsPerPage = 8;
  const filteredNews = allNews.filter((news) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return (
      news.title.toLowerCase().includes(normalizedQuery) ||
      news.pubDate.toLowerCase().includes(normalizedQuery)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, startIndex + itemsPerPage);
  const hasSingleRowResults = !isLoading && currentNews.length > 0 && currentNews.length <= 4;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/v1/news?limit=30&start=1`);

        if (!response.ok) {
          throw new Error('News fetch failed');
        }

        const data = await response.json();
        setAllNews(data);
      } catch (error) {
        console.error('[NewsPage] failed to load news:', error);
        setAllNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  return (
    <div className="w-full">
      <section className="max-w-3xl mx-auto mb-10">
        <SearchBar
          searchType="news"
          placeholder="Search news by title or date"
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
              <div className="text-sm font-bold text-on-surface dark:text-white line-clamp-2">
                {item.title}
              </div>
              <div className="mt-1 text-xs text-on-surface-variant dark:text-slate-400">
                {item.pubDate}
              </div>
            </div>
          )}
        />
      </section>

      <header className="mb-12 flex flex-col items-center justify-center space-y-4">
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tighter text-on-surface dark:text-white">
          News Briefing <span className="text-primary dark:text-blue-400">Archive</span>
        </h1>
        <p className="text-on-surface-variant dark:text-slate-400 font-medium text-sm">
          Filter the latest 30 defense news items by title or publication date.
        </p>
      </header>

      <div className="bg-surface-container-lowest dark:bg-slate-900/50 p-8 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] border border-transparent dark:border-slate-800 transition-all">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-blue-400" translate="no">breaking_news</span>
            Latest News
          </h2>
          <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">
            {searchQuery.trim() ? `${filteredNews.length} matches` : `Total ${allNews.length}`}
          </span>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${
            hasSingleRowResults ? '' : 'min-h-[400px]'
          }`}
        >
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center">
              <span className="text-on-surface-variant dark:text-slate-400 font-medium">Loading news...</span>
            </div>
          ) : currentNews.length > 0 ? (
            currentNews.map((news) => {
              const proxyUrl =
                news.thumbnail && news.thumbnail !== 'https://via.placeholder.com/300x200?text=No+Image'
                  ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/news/image?url=${encodeURIComponent(news.thumbnail)}`
                  : 'https://szpwchwghfsswtdrtrmr.supabase.co/storage/v1/object/public/food-media/thumbnail.png';

              return (
                <div
                  key={news.link}
                  className={`group cursor-pointer flex flex-col ${hasSingleRowResults ? '' : 'h-full'}`}
                  onClick={() => window.open(news.link, '_blank')}
                >
                  <div className="aspect-video w-full rounded-lg bg-surface-dim dark:bg-slate-800 mb-4 overflow-hidden flex-shrink-0">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={proxyUrl}
                      alt={news.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://szpwchwghfsswtdrtrmr.supabase.co/storage/v1/object/public/food-media/thumbnail.png';
                      }}
                    />
                  </div>
                  <div className={`flex flex-col ${hasSingleRowResults ? '' : 'flex-grow'}`}>
                    <h3
                      className="text-base font-bold text-on-surface dark:text-white leading-snug group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-3 mb-2"
                      dangerouslySetInnerHTML={{ __html: news.title }}
                    />
                    <p className="text-xs text-on-surface-variant dark:text-slate-500 mt-auto font-medium">
                      {news.pubDate}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex justify-center items-center text-on-surface-variant dark:text-slate-400 font-medium">
              No news matched your search.
            </div>
          )}
        </div>

        {!isLoading && filteredNews.length > 0 ? (
          <div className="mt-12 flex justify-center items-center space-x-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-full flex items-center justify-center transition-colors text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" translate="no">chevron_left</span>
            </button>
            <span className="text-sm font-bold tracking-widest text-on-surface dark:text-white">
              {currentPage} <span className="text-on-surface-variant/50 mx-1">/</span> {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full flex items-center justify-center transition-colors text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" translate="no">chevron_right</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
