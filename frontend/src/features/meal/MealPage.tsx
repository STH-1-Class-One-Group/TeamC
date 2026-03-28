import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { buildApiUrl } from '../../api/apiBaseUrl';
import { SearchBar } from '../../components/common/SearchBar';
import { CalendarPopup } from './components/CalendarPopup';

interface MealItem {
  name: string;
  calorie: string;
}

interface ParsedMeal {
  items: MealItem[];
  totalCal: number;
}

interface DayMealData {
  title: string;
  shortDate: string;
  isToday: boolean;
  apiDate: string;
  dayOffset: number;
  breakfast: ParsedMeal;
  lunch: ParsedMeal;
  dinner: ParsedMeal;
  dailyTotal: number;
}

interface MealApiRow {
  dates: string;
  brst?: string;
  brst_cal?: string;
  lnch?: string;
  lunc?: string;
  lnch_cal?: string;
  lunc_cal?: string;
  dnr?: string;
  dinr?: string;
  dnr_cal?: string;
  dinr_cal?: string;
  sum_cal?: string;
}

interface MealApiResponse {
  success: boolean;
  date: string;
  data: MealApiRow[];
  is_fallback?: boolean;
}

interface MealSearchSuggestion {
  id: string;
  keyword: string;
  apiDate: string;
  shortDate: string;
  relativeLabel: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDateInfo = (baseDate: Date, offset: number) => {
  const target = new Date(baseDate);
  target.setDate(target.getDate() + offset);

  const year = target.getFullYear();
  const monthStr = String(target.getMonth() + 1).padStart(2, '0');
  const dayStr = String(target.getDate()).padStart(2, '0');
  const dayName = DAYS[target.getDay()];

  return {
    apiString: `${year}-${monthStr}-${dayStr}`,
    displayString: `${year}-${monthStr}-${dayStr}(${dayName})`,
    shortDate: `${monthStr}. ${dayStr}`,
  };
};

const getFallbackData = (displayString: string) => [
  { dates: displayString, brst: '밥', brst_cal: '374.13kcal', lnch: '밥', lnch_cal: '374.13kcal', dnr: '밥', dnr_cal: '374.13kcal', sum_cal: '2961.19kcal' },
  { dates: displayString, brst: '참치 고추장찌개(05)(06)(09)(16)', brst_cal: '148.73kcal', lnch: '양배추샐러드(05)(06)(16)', lnch_cal: '41.88kcal', dnr: '미역줄기볶음(05)(15)', dnr_cal: '451.14kcal', sum_cal: '2961.19kcal' },
  { dates: displayString, brst: '애호박볶음(05)(06)(10)(18)', brst_cal: '111.5kcal', lnch: '사천식멸치볶음(04)(05)', lnch_cal: '102.06kcal', dnr: '감자채볶음(02)(05)(06)(16)(18)', dnr_cal: '164.58kcal', sum_cal: '2961.19kcal' },
  { dates: displayString, brst: '계란말이(01)(05)(12)', brst_cal: '106kcal', lnch: '고추장불고기볶음(05)(10)', lnch_cal: '482.33kcal', dnr: '오이무침(05)', dnr_cal: '37.98kcal', sum_cal: '2961.19kcal' },
  { dates: displayString, brst: '배추김치', brst_cal: '13.8kcal', lnch: '배추김치', lnch_cal: '13.8kcal', dnr: '유부된장국(02)(06)', dnr_cal: '165kcal', sum_cal: '2961.19kcal' },
  { dates: displayString, brst: '', brst_cal: '', lnch: '', lnch_cal: '', dnr: '배추김치', dnr_cal: '0kcal', sum_cal: '2961.19kcal' },
];

const cleanString = (value?: string) => (value ? value.replace(/\([^)]*\)/g, '').trim() : '');

const getStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseApiDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const getDatePrefix = (value: string) => {
  const matched = value.match(/\d{4}-\d{2}-\d{2}/);
  return matched ? matched[0] : '';
};

const getDayOffset = (targetDateString: string, referenceDate: Date) => {
  const target = parseApiDate(targetDateString);
  const startTarget = getStartOfDay(target).getTime();
  const startReference = getStartOfDay(referenceDate).getTime();
  return Math.round((startTarget - startReference) / (1000 * 60 * 60 * 24));
};

const getRelativeDayLabel = (dayOffset: number) => {
  if (dayOffset === 0) return '오늘';
  if (dayOffset === 1) return '내일';
  if (dayOffset === -1) return '어제';
  if (dayOffset > 1) return `${dayOffset}일 후`;
  return `${Math.abs(dayOffset)}일 전`;
};

const processMealsAPI = (data: MealApiRow[]): { b: ParsedMeal; l: ParsedMeal; d: ParsedMeal; dailyTotal: number } => {
  let zeroCalCount = 0;
  let sumCalBase = 0;

  if (data.length > 0) {
    const firstSumCalStr = data[0].sum_cal || '0';
    sumCalBase = parseFloat(firstSumCalStr.replace(/[^0-9.]/g, '')) || 0;
  }

  const parseItemAndCalorie = (nameStr?: string, calStr?: string): MealItem | null => {
    const name = cleanString(nameStr);
    if (!name) {
      return null;
    }

    let calorie = calStr ? calStr.trim() : '';
    if (!calorie || calorie === '0kcal') {
      calorie = '53kcal';
      zeroCalCount += 1;
    }

    return { name, calorie };
  };

  const breakfastItems: MealItem[] = [];
  const lunchItems: MealItem[] = [];
  const dinnerItems: MealItem[] = [];

  data.forEach((item) => {
    const breakfast = parseItemAndCalorie(item.brst, item.brst_cal);
    const lunch = parseItemAndCalorie(item.lnch || item.lunc, item.lnch_cal || item.lunc_cal);
    const dinner = parseItemAndCalorie(item.dnr || item.dinr, item.dnr_cal || item.dinr_cal);

    if (breakfast) {
      breakfastItems.push(breakfast);
    }

    if (lunch) {
      lunchItems.push(lunch);
    }

    if (dinner) {
      dinnerItems.push(dinner);
    }
  });

  const getTotal = (items: MealItem[]) =>
    Math.round(
      items.reduce((sum, item) => sum + (parseFloat(item.calorie.replace(/[^0-9.]/g, '')) || 0), 0) * 100
    ) / 100;

  const dailyTotal = Math.round((sumCalBase + zeroCalCount * 53) * 100) / 100;

  return {
    b: { items: breakfastItems, totalCal: getTotal(breakfastItems) },
    l: { items: lunchItems, totalCal: getTotal(lunchItems) },
    d: { items: dinnerItems, totalCal: getTotal(dinnerItems) },
    dailyTotal,
  };
};

const createDayMealData = (
  apiDate: string,
  parsed: { b: ParsedMeal; l: ParsedMeal; d: ParsedMeal; dailyTotal: number },
  referenceDate: Date
): DayMealData => {
  const date = parseApiDate(apiDate);
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  const dayStr = String(date.getDate()).padStart(2, '0');
  const dayOffset = getDayOffset(apiDate, referenceDate);

  return {
    title: getRelativeDayLabel(dayOffset),
    shortDate: `${monthStr}. ${dayStr}`,
    isToday: dayOffset === 0,
    apiDate,
    dayOffset,
    breakfast: parsed.b,
    lunch: parsed.l,
    dinner: parsed.d,
    dailyTotal: parsed.dailyTotal,
  };
};

const isBetterSuggestion = (
  candidateOffset: number,
  candidateDate: string,
  currentOffset: number,
  currentDate: string
) => {
  const candidateDistance = Math.abs(candidateOffset);
  const currentDistance = Math.abs(currentOffset);

  if (candidateDistance !== currentDistance) {
    return candidateDistance < currentDistance;
  }

  const candidateIsFutureOrToday = candidateOffset >= 0;
  const currentIsFutureOrToday = currentOffset >= 0;

  if (candidateIsFutureOrToday !== currentIsFutureOrToday) {
    return candidateIsFutureOrToday;
  }

  return candidateDate < currentDate;
};

export const MealPage: React.FC = () => {
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [mealDays, setMealDays] = useState<DayMealData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mealSuggestions, setMealSuggestions] = useState<MealSearchSuggestion[]>([]);
  const [isSearchIndexLoading, setIsSearchIndexLoading] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState('');

  const currentInfo = getDateInfo(baseDate, 0);
  const headerDateStr = `${baseDate.getFullYear()}. ${currentInfo.shortDate}`;
  const fetchMealDayData = async (dateString: string, referenceDate: Date) => {
    const info = getDateInfo(referenceDate, getDayOffset(dateString, referenceDate));
    let finalData: MealApiRow[] = [];

    try {
      const response = await fetch(buildApiUrl(`/api/v1/meals/${dateString}`));
      if (!response.ok) {
        throw new Error('Failed to fetch meal day');
      }

      const result: MealApiResponse = await response.json();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error('Meal day is empty');
      }

      finalData = result.data;
    } catch (error) {
      console.warn(`[MealPage] fallback meal data used for ${dateString}`, error);
      finalData = getFallbackData(info.displayString) as MealApiRow[];
    }

    const parsed = processMealsAPI(finalData);

    return createDayMealData(dateString, parsed, referenceDate);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAllMeals = async () => {
      setIsLoading(true);

      try {
        const offsets = [-1, 0, 1];
        const results = await Promise.all(
          offsets.map(async (offset) => {
            const info = getDateInfo(baseDate, offset);
            const dayData = await fetchMealDayData(info.apiString, baseDate);

            return {
              ...dayData,
              title: offset === -1 ? '어제' : offset === 0 ? '오늘' : '내일',
              shortDate: info.shortDate,
              isToday: offset === 0,
              dayOffset: offset,
            } as DayMealData;
          })
        );

        if (isMounted) {
          setMealDays(results);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAllMeals();

    return () => {
      isMounted = false;
    };
  }, [baseDate]);

  useEffect(() => {
    let isMounted = true;

    const buildSearchSuggestions = async () => {
      setIsSearchIndexLoading(true);
      setSearchFeedback('');

      try {
        const response = await fetch(buildApiUrl('/api/v1/meals'));
        if (!response.ok) {
          throw new Error('Failed to fetch meal search index');
        }

        const result: MealApiResponse = await response.json();
        const groupedMeals = new Map<string, MealApiRow[]>();

        result.data.forEach((item) => {
          const datePrefix = getDatePrefix(item.dates);
          if (!datePrefix) {
            return;
          }

          const rows = groupedMeals.get(datePrefix) || [];
          rows.push(item);
          groupedMeals.set(datePrefix, rows);
        });

        const today = new Date();
        const bestSuggestionByKeyword = new Map<string, MealSearchSuggestion & { offset: number }>();

        groupedMeals.forEach((rows, dateString) => {
          const parsed = processMealsAPI(rows);
          const dayData = createDayMealData(dateString, parsed, today);
          const keywords = new Set(
            [...parsed.b.items, ...parsed.l.items, ...parsed.d.items]
              .map((item) => item.name.trim())
              .filter(Boolean)
          );

          keywords.forEach((keyword) => {
            const normalizedKeyword = keyword.toLowerCase();
            const existing = bestSuggestionByKeyword.get(normalizedKeyword);
            const nextSuggestion = {
              id: `${dateString}-${keyword}`,
              keyword,
              apiDate: dateString,
              shortDate: dayData.shortDate,
              relativeLabel: getRelativeDayLabel(dayData.dayOffset),
              offset: dayData.dayOffset,
            };

            if (
              !existing ||
              isBetterSuggestion(nextSuggestion.offset, nextSuggestion.apiDate, existing.offset, existing.apiDate)
            ) {
              bestSuggestionByKeyword.set(normalizedKeyword, nextSuggestion);
            }
          });
        });

        const sortedSuggestions = Array.from(bestSuggestionByKeyword.values())
          .sort((left, right) => {
            const leftDistance = Math.abs(left.offset);
            const rightDistance = Math.abs(right.offset);

            if (leftDistance !== rightDistance) {
              return leftDistance - rightDistance;
            }

            if (left.offset >= 0 && right.offset < 0) {
              return -1;
            }

            if (left.offset < 0 && right.offset >= 0) {
              return 1;
            }

            return left.keyword.localeCompare(right.keyword);
          })
          .map(({ offset, ...suggestion }) => suggestion);

        if (isMounted) {
          setMealSuggestions(sortedSuggestions);
        }
      } catch (error) {
        console.error('[MealPage] failed to build meal search suggestions:', error);
        if (isMounted) {
          setMealSuggestions([]);
          setSearchFeedback('식단 검색어를 불러오지 못했습니다.');
        }
      } finally {
        if (isMounted) {
          setIsSearchIndexLoading(false);
        }
      }
    };

    void buildSearchSuggestions();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderMealBox = (mealCode: 'brst' | 'lnch' | 'dnr', parsed: ParsedMeal, isToday: boolean) => {
    let icon = '';
    let label = '';

    if (mealCode === 'brst') {
      icon = 'wb_twilight';
      label = '조식';
    } else if (mealCode === 'lnch') {
      icon = 'light_mode';
      label = '중식';
    } else {
      icon = 'dark_mode';
      label = '석식';
    }

    return (
      <div
        className={`rounded-xl bg-surface-container-lowest p-6 space-y-4 dark:bg-slate-900 ${
          isToday ? 'border-l-4 border-primary shadow-lg shadow-primary/5' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest ${
              isToday ? 'text-primary dark:text-blue-400' : 'text-primary dark:text-blue-400'
            }`}
          >
            <span className="material-symbols-outlined text-sm" translate="no">
              {icon}
            </span>
            <span>{label}</span>
          </div>
          <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold text-tertiary-container dark:bg-slate-800 dark:text-slate-300">
            {parsed.totalCal.toLocaleString()} kcal
          </span>
        </div>
        <ul
          className={`space-y-2 text-sm ${
            isToday ? 'grid grid-cols-1 gap-1 text-on-surface dark:text-slate-200' : 'text-secondary dark:text-slate-400'
          }`}
        >
          {parsed.items.length > 0 ? (
            parsed.items.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className={
                  isToday
                    ? 'flex items-center justify-between border-b border-surface-container-low py-1.5 font-medium dark:border-slate-800'
                    : 'flex items-center justify-between'
                }
              >
                <span>{item.name}</span>
                <span className={isToday ? 'font-medium text-primary dark:text-blue-400' : 'text-on-surface-variant/70 dark:text-slate-500'}>
                  {item.calorie}
                </span>
              </li>
            ))
          ) : (
            <li>식단 정보 없음</li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Helmet>
        <title>군 급식 정보 | Modern Sentinel</title>
        <meta name="description" content="오늘과 전후 날짜의 군 급식 메뉴를 검색하고 확인할 수 있습니다." />
        <meta property="og:title" content="군 급식 정보 | Modern Sentinel" />
        <meta property="og:description" content="오늘과 전후 날짜의 군 급식 메뉴를 검색하고 확인할 수 있습니다." />
      </Helmet>
      <div className="mx-auto mb-8 max-w-2xl sm:mb-10">
        <SearchBar
          searchType="food"
          placeholder="메뉴명을 검색하면 관련 식단 5개를 추천합니다"
          localItems={mealSuggestions}
          searchKeys={['keyword']}
          maxResults={5}
          getItemLabel={(item: MealSearchSuggestion) => item.keyword}
          onQueryChange={(query) => {
            setSearchQuery(query);
            if (!query.trim()) {
              setSearchFeedback('');
            }
          }}
          onSearchSelect={(item: MealSearchSuggestion | null) => {
            if (!item) {
              setSearchQuery('');
              setSearchFeedback('');
              return;
            }

            setSearchQuery(item.keyword);
            setBaseDate(parseApiDate(item.apiDate));
            setSearchFeedback(`${item.keyword} 식단으로 이동했습니다. (${item.relativeLabel} · ${item.shortDate})`);
          }}
          renderItem={(item: MealSearchSuggestion) => (
            <div>
              <div className="text-sm font-bold text-on-surface dark:text-white">{item.keyword}</div>
              <div className="mt-1 text-xs text-on-surface-variant dark:text-slate-400">
                {item.relativeLabel} · {item.shortDate}
              </div>
            </div>
          )}
        />
        <div className="mt-3 px-2 text-sm text-on-surface-variant dark:text-slate-400">
          {isSearchIndexLoading
            ? '식단 검색어를 준비하는 중입니다...'
            : searchFeedback ||
              (searchQuery.trim()
                ? '추천 검색어를 선택하면 해당 날짜가 가운데로 이동합니다.'
                : '메뉴명을 검색하면 해당 메뉴가 포함된 날짜를 바로 찾을 수 있습니다.')}
        </div>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center space-y-5 sm:mb-12 sm:space-y-6">
        <div className="flex w-full max-w-3xl items-center justify-between gap-2 rounded-[28px] border border-transparent bg-surface-container-lowest px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:w-auto sm:justify-center sm:space-x-8 sm:gap-0 sm:px-6">
          <button
            className="material-symbols-outlined rounded-full p-2 text-primary transition-all active:scale-90 hover:bg-surface-container-low dark:text-blue-400 dark:hover:bg-slate-800"
            translate="no"
            onClick={() => setBaseDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1))}
          >
            arrow_back
          </button>
          <button className="group flex min-w-0 flex-1 items-center justify-center space-x-2 text-center focus:outline-none sm:flex-initial sm:space-x-3" onClick={() => setIsCalendarOpen(true)}>
            <span className="truncate text-lg font-bold tracking-tight text-on-surface dark:text-white sm:text-2xl">{headerDateStr}</span>
            <span className="material-symbols-outlined text-primary transition-transform group-hover:translate-y-0.5 dark:text-blue-400" translate="no">
              calendar_month
            </span>
          </button>
          <button
            className="material-symbols-outlined rounded-full p-2 text-primary transition-all active:scale-90 hover:bg-surface-container-low dark:text-blue-400 dark:hover:bg-slate-800"
            translate="no"
            onClick={() => setBaseDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1))}
          >
            arrow_forward
          </button>
        </div>
        <p className="text-sm font-medium text-on-surface-variant dark:text-slate-400">병영 식단을 날짜 기준으로 확인할 수 있습니다.</p>
      </header>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="text-on-surface-variant dark:text-slate-400">식단 정보를 불러오는 중입니다...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {mealDays.map((dayData) => {
            const isToday = dayData.isToday;

            return (
              <section
                key={dayData.apiDate}
                className={`relative space-y-5 transition-opacity sm:space-y-6 ${!isToday ? 'opacity-90 lg:opacity-60 hover:opacity-100' : ''}`}
              >
                {isToday ? (
                  <div className="pointer-events-none absolute -inset-4 hidden rounded-3xl border-2 border-primary/20 dark:border-blue-400/20 md:block" />
                ) : null}

                <div className="relative mb-4 text-center">
                  {isToday ? (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-white dark:bg-blue-600">
                      Current Day
                    </span>
                  ) : null}
                  <h2 className={`text-xl font-extrabold ${isToday ? 'text-primary dark:text-blue-400' : 'text-on-surface-variant dark:text-slate-300'}`}>
                    {dayData.title} ({dayData.shortDate})
                  </h2>
                  <div className="mt-1 text-sm font-bold text-on-surface-variant dark:text-slate-400">
                    총 <span className="text-primary dark:text-blue-400">{dayData.dailyTotal.toLocaleString()}</span> kcal
                  </div>
                </div>

                {renderMealBox('brst', dayData.breakfast, isToday)}
                {renderMealBox('lnch', dayData.lunch, isToday)}
                {renderMealBox('dnr', dayData.dinner, isToday)}
              </section>
            );
          })}
        </div>
      )}

      <CalendarPopup
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={baseDate}
        onSelectDate={(date) => setBaseDate(date)}
      />
    </div>
  );
};
