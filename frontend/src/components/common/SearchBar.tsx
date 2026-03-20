import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabaseClient';

export interface SearchBarProps {
  placeholder?: string;
  onSearchSelect?: (item: any | null) => void;
  searchType?: 'food' | 'news' | 'recruitment';
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "찾으시는 상품이나 정보를 입력하세요", 
  onSearchSelect, 
  searchType = 'food' 
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
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        if (searchType === 'food') {
          const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5);

          if (error) throw error;
          setResults(data || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, searchType]);

  const handleSelect = (item: any) => {
    setQuery(item.name || item.title || '');
    setShowDropdown(false);
    if (onSearchSelect) {
      onSearchSelect(item);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);
    if (value.trim() === '') {
      setShowDropdown(false);
      if (onSearchSelect) {
        onSearchSelect(null);
      }
    }
  };

  return (
    <div ref={searchRef} className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-outline-variant group-focus-within:text-primary transition-colors">search</span>
      </div>
      <input 
        className="block w-full pl-14 pr-16 py-4 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-full text-sm font-medium placeholder:text-outline transition-all shadow-sm text-on-surface dark:text-white" 
        placeholder={placeholder} 
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => { if (query.trim()) setShowDropdown(true); }}
      />
      <button 
        className="absolute inset-y-2 right-2 px-4 flex items-center justify-center bg-primary text-on-primary rounded-full hover:bg-on-primary-fixed-variant transition-colors"
        onClick={() => {
          if (results.length > 0) {
            handleSelect(results[0]);
          }
        }}
        aria-label="Submit search"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
      </button>

      {/* Dropdown */}
      {showDropdown && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">검색중...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((item, idx) => (
                <li 
                  key={idx} 
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  {searchType === 'food' ? (
                    <div className="flex items-center gap-4">
                      {item.image_url && (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden flex-shrink-0">
                          <img 
                            src={item.image_url.startsWith('http') ? item.image_url : supabase.storage.from('food-images').getPublicUrl(item.image_url).data.publicUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-on-surface dark:text-white mb-1">{item.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-primary dark:text-blue-400">₩{item.price.toLocaleString()}</span>
                          <span className="text-[10px] text-on-surface-variant dark:text-slate-400 bg-surface-container-low dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            {item.calories} kcal
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-on-surface dark:text-white">{item.title || item.name}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">검색 결과가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
};
