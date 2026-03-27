import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseErrorMessage, supabase } from '../../api/supabaseClient';

type SearchType = 'food' | 'news' | 'recruitment';

export interface SearchBarProps {
  placeholder?: string;
  onSearchSelect?: (item: any | null) => void;
  onQueryChange?: (query: string) => void;
  searchType?: SearchType;
  localItems?: any[];
  searchKeys?: string[];
  maxResults?: number;
  getItemLabel?: (item: any) => string;
  renderItem?: (item: any) => React.ReactNode;
}

const DEFAULT_PLACEHOLDERS: Record<SearchType, string> = {
  food: '상품명 또는 영양 정보 검색',
  news: '뉴스 제목 또는 날짜로 검색',
  recruitment: '채용 정보 검색',
};

const getFoodImageUrl = (imageUrl: string) => {
  if (!imageUrl) {
    return '';
  }

  return imageUrl.startsWith('http')
    ? imageUrl
    : supabase.storage.from('food-images').getPublicUrl(imageUrl).data.publicUrl;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  onSearchSelect,
  onQueryChange,
  searchType = 'food',
  localItems,
  searchKeys = [],
  maxResults = 5,
  getItemLabel,
  renderItem,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    onQueryChange?.(query);
  }, [onQueryChange, query]);

  useEffect(() => {
    const fetchResults = async () => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        if (localItems) {
          const normalizedQuery = trimmedQuery.toLowerCase();
          const filteredItems = localItems.filter((item) =>
            searchKeys.some((key) => {
              const value = item?.[key];
              return typeof value === 'string' && value.toLowerCase().includes(normalizedQuery);
            })
          );

          setResults(filteredItems.slice(0, maxResults));
          return;
        }

        if (searchType === 'food') {
          const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .ilike('name', `%${trimmedQuery}%`)
            .limit(maxResults);

          if (error) {
            throw error;
          }

          setResults(data || []);
          return;
        }

        setResults([]);
      } catch (error) {
        console.error('[SearchBar] search failed:', getSupabaseErrorMessage(error));
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = window.setTimeout(fetchResults, 250);
    return () => window.clearTimeout(debounceTimer);
  }, [localItems, maxResults, query, searchKeys, searchType]);

  const resolveItemLabel = (item: any) => {
    if (getItemLabel) {
      return getItemLabel(item);
    }

    return item?.name || item?.title || '';
  };

  const handleSelect = (item: any) => {
    const nextQuery = resolveItemLabel(item);
    setQuery(nextQuery);
    setShowDropdown(false);
    onSearchSelect?.(item);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    setShowDropdown(Boolean(value.trim()));

    if (!value.trim()) {
      onSearchSelect?.(null);
    }
  };

  const renderDefaultItem = (item: any) => {
    if (searchType === 'food') {
      const imageUrl = getFoodImageUrl(item.image_url);

      return (
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden flex-shrink-0">
              <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          ) : null}
          <div>
            <div className="text-sm font-bold text-on-surface dark:text-white mb-1">{item.name}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-primary dark:text-blue-400">
                {typeof item.price === 'number' ? `${item.price.toLocaleString()}원` : ''}
              </span>
              <span className="text-[10px] text-on-surface-variant dark:text-slate-400 bg-surface-container-low dark:bg-slate-700 px-1.5 py-0.5 rounded">
                {item.calories} kcal
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (searchType === 'news') {
      return (
        <div>
          <div className="text-sm font-bold text-on-surface dark:text-white line-clamp-2">{item.title}</div>
          <div className="mt-1 text-xs text-on-surface-variant dark:text-slate-400">{item.pubDate}</div>
        </div>
      );
    }

    return <div className="text-sm font-bold text-on-surface dark:text-white">{resolveItemLabel(item)}</div>;
  };

  return (
    <div ref={searchRef} className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-outline-variant group-focus-within:text-primary transition-colors" translate="no">
          search
        </span>
      </div>
      <input
        className="block w-full pl-14 pr-16 py-4 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-full text-sm font-medium placeholder:text-outline transition-all shadow-sm text-on-surface dark:text-white"
        placeholder={placeholder || DEFAULT_PLACEHOLDERS[searchType]}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => {
          if (query.trim()) {
            setShowDropdown(true);
          }
        }}
      />
      <button
        type="button"
        className="absolute inset-y-2 right-2 px-4 flex items-center justify-center bg-primary text-on-primary rounded-full hover:bg-on-primary-fixed-variant transition-colors"
        onClick={() => {
          if (results.length > 0) {
            handleSelect(results[0]);
          }
        }}
        aria-label="검색 실행"
      >
        <span className="material-symbols-outlined text-[20px]" translate="no">arrow_forward</span>
      </button>

      {showDropdown && query.trim() ? (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">검색 중...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((item, index) => (
                <li
                  key={item?.id || item?.link || index}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  {renderItem ? renderItem(item) : renderDefaultItem(item)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">결과가 없습니다.</div>
          )}
        </div>
      ) : null}
    </div>
  );
};
