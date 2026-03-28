import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  buildApiUrl,
  getApiResponseErrorMessage,
  getApiRuntimeErrorMessage,
  isNetworkFetchError,
} from '../../api/apiBaseUrl';
import { calculateServiceTimeline } from '../../utils/serviceDates';
import { fetchNewsBatch } from '../news/newsApi';
import { Profile } from '../profile/types';
import { MealPopup, MealItem } from './components/MealPopup';

interface MealData {
  dates: string;
  brst?: string;
  brst_cal?: string;
  lnch?: string;
  lnch_cal?: string;
  lunc?: string;
  lunc_cal?: string;
  dnr?: string;
  dnr_cal?: string;
  dinr?: string;
  dinr_cal?: string;
  sum_cal?: string;
}

interface MealApiResponse {
  success: boolean;
  date: string;
  data: MealData[];
  is_fallback: boolean;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
}

interface DashboardPageProps {
  profile: Profile | null;
}

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDisplayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[today.getDay()];
  return `${year}-${month}-${day}(${dayName})`;
};

const FALLBACK_MEALS = (todayDisplay: string): MealData[] => [
  { dates: todayDisplay, brst: '보리밥', brst_cal: '374.13kcal', lnch: '쌀밥', lnch_cal: '374.13kcal', dnr: '잡곡밥', dnr_cal: '374.13kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: '참치고추샐러드', brst_cal: '148.73kcal', lnch: '야채수프', lnch_cal: '41.88kcal', dnr: '단호박찜', dnr_cal: '451.14kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: '나물무침', brst_cal: '111.5kcal', lnch: '멸치볶음', lnch_cal: '102.06kcal', dnr: '소고기무국', dnr_cal: '164.58kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: '계란찜', brst_cal: '106kcal', lnch: '제육볶음', lnch_cal: '482.33kcal', dnr: '오이피클', dnr_cal: '37.98kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: '배추김치', brst_cal: '13.8kcal', lnch: '배추김치', lnch_cal: '13.8kcal', dnr: '초코우유', dnr_cal: '165kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: '', brst_cal: '', lnch: '', lnch_cal: '', dnr: '배추김치', dnr_cal: '0kcal', sum_cal: '2961.19kcal' },
];

const DEFAULT_MEAL_INFO = {
  breakfast: '불러오는 중...',
  lunch: '불러오는 중...',
  dinner: '불러오는 중...',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ profile }) => {
  const navigate = useNavigate();
  const didInitRef = useRef(false);
  const performanceOriginRef = useRef<number | null>(null);
  const servicePanelRef = useRef<HTMLDivElement | null>(null);

  const [liveNowMs, setLiveNowMs] = useState(() => {
    const initialOrigin = Date.now() - performance.now();
    performanceOriginRef.current = initialOrigin;
    return initialOrigin + performance.now();
  });
  const [visualProgressPercent, setVisualProgressPercent] = useState(0);
  const [isServicePanelVisible, setIsServicePanelVisible] = useState(false);

  const [mealInfo, setMealInfo] = useState(DEFAULT_MEAL_INFO);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [mealError, setMealError] = useState('');
  const [newsError, setNewsError] = useState('');

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [selectedMealItems, setSelectedMealItems] = useState<MealItem[]>([]);
  const [selectedTotalCalories, setSelectedTotalCalories] = useState(0);
  const [todayDateLabel, setTodayDateLabel] = useState('');

  const [fullMealData, setFullMealData] = useState({
    breakfastItems: [] as MealItem[],
    lunchItems: [] as MealItem[],
    dinnerItems: [] as MealItem[],
    totalCalories: 0,
  });

  useEffect(() => {
    const node = servicePanelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsServicePanelVisible(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (performanceOriginRef.current == null) {
      performanceOriginRef.current = Date.now() - performance.now();
    }

    if (!isServicePanelVisible) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (performanceOriginRef.current != null) {
        setLiveNowMs(performanceOriginRef.current + performance.now());
      }
    }, 70);

    return () => window.clearInterval(intervalId);
  }, [isServicePanelVisible]);

  const serviceTimeline = calculateServiceTimeline({
    userType: profile?.user_type,
    serviceTrack: profile?.service_track,
    enlistmentDate: profile?.enlistment_date,
    cadreCategory: profile?.cadre_category,
    rank: profile?.rank,
    acquaintanceName: profile?.acquaintance_name,
    acquaintanceServiceTrack: profile?.acquaintance_service_track,
    acquaintanceEnlistmentDate: profile?.acquaintance_enlistment_date,
    now: new Date(liveNowMs),
  });

  useEffect(() => {
    if (didInitRef.current) {
      return;
    }
    didInitRef.current = true;

    const processMealData = async (data: MealData[]) => {
      const cleanString = (value?: string) => (value ? value.replace(/\([^)]*\)/g, '').trim() : '');

      let zeroCalCount = 0;
      let sumCalBase = 0;
      let currentDateLabel = getTodayDisplayString();

      if (data.length > 0) {
        currentDateLabel = data[0].dates || currentDateLabel;
        const firstSumCalStr = data[0].sum_cal || '0';
        sumCalBase = parseFloat(firstSumCalStr.replace(/[^0-9.]/g, '')) || 0;
      }

      setTodayDateLabel(currentDateLabel);

      const breakfastItems: MealItem[] = [];
      const lunchItems: MealItem[] = [];
      const dinnerItems: MealItem[] = [];

      const parseItem = (nameStr?: string, calStr?: string): MealItem | null => {
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

      for (const item of data) {
        const breakfast = parseItem(item.brst, item.brst_cal);
        const lunch = parseItem(item.lnch || item.lunc, item.lnch_cal || item.lunc_cal);
        const dinner = parseItem(item.dnr || item.dinr, item.dnr_cal || item.dinr_cal);

        if (breakfast) {
          breakfastItems.push(breakfast);
        }
        if (lunch) {
          lunchItems.push(lunch);
        }
        if (dinner) {
          dinnerItems.push(dinner);
        }

        const runningTotal = Math.round((sumCalBase + zeroCalCount * 53) * 100) / 100;

        setMealInfo({
          breakfast: breakfastItems.length > 0 ? breakfastItems.map((entry) => entry.name).join(', ') : DEFAULT_MEAL_INFO.breakfast,
          lunch: lunchItems.length > 0 ? lunchItems.map((entry) => entry.name).join(', ') : DEFAULT_MEAL_INFO.lunch,
          dinner: dinnerItems.length > 0 ? dinnerItems.map((entry) => entry.name).join(', ') : DEFAULT_MEAL_INFO.dinner,
        });

        setFullMealData({
          breakfastItems: [...breakfastItems],
          lunchItems: [...lunchItems],
          dinnerItems: [...dinnerItems],
          totalCalories: runningTotal,
        });

        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      const adjustedTotalCalories = Math.round((sumCalBase + zeroCalCount * 53) * 100) / 100;
      setMealInfo({
        breakfast: breakfastItems.length > 0 ? breakfastItems.map((entry) => entry.name).join(', ') : '식단 정보 없음',
        lunch: lunchItems.length > 0 ? lunchItems.map((entry) => entry.name).join(', ') : '식단 정보 없음',
        dinner: dinnerItems.length > 0 ? dinnerItems.map((entry) => entry.name).join(', ') : '식단 정보 없음',
      });
      setFullMealData({
        breakfastItems,
        lunchItems,
        dinnerItems,
        totalCalories: adjustedTotalCalories,
      });
    };

    const fetchMeals = async () => {
      setMealInfo(DEFAULT_MEAL_INFO);
      setMealError('');

      try {
        const todayDate = getTodayString();
        const response = await fetch(buildApiUrl(`/api/v1/meals/${todayDate}`));
        if (!response.ok) {
          throw new Error(getApiResponseErrorMessage(response.status, '식단 데이터'));
        }

        const result: MealApiResponse = await response.json();
        if (!result.success || !result.data || result.data.length === 0) {
          throw new Error('No meal data available');
        }

        await processMealData(result.data);
      } catch (error) {
        console.error('[DashboardPage] meal fetch failed, using fallback:', error);
        setMealError(
          isNetworkFetchError(error)
            ? getApiRuntimeErrorMessage('식단 데이터')
            : '식단 데이터를 불러오지 못해 기본 메뉴를 표시합니다.',
        );
        await processMealData(FALLBACK_MEALS(getTodayDisplayString()));
      }
    };

    const fetchNews = async () => {
      setIsNewsLoading(true);
      setNewsList([]);
      setNewsError('');
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetchNewsBatch(4, 1, {
          signal: controller.signal,
          forceRefresh: false,
        });
        if (!response.ok) {
          throw new Error(getApiResponseErrorMessage(response.status, '뉴스'));
        }

        const data: NewsItem[] = await response.json();
        const uniqueNews = data.filter(
          (item, index, array) =>
            item.link && array.findIndex((candidate) => candidate.link === item.link) === index,
        );
        setNewsList(uniqueNews);
      } catch (error) {
        console.error('[DashboardPage] news fetch failed:', error);
        setNewsError(
          isNetworkFetchError(error)
            ? getApiRuntimeErrorMessage('뉴스')
            : '뉴스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
      } finally {
        window.clearTimeout(timeoutId);
        setIsNewsLoading(false);
      }
    };

    void fetchMeals();
    void fetchNews();
  }, []);

  useEffect(() => {
    setVisualProgressPercent(serviceTimeline.progressPercent);
  }, [serviceTimeline.progressPercent]);

  const handleMealClick = (mealType: string, items: MealItem[]) => {
    setSelectedMealType(mealType);
    setSelectedMealItems(items);
    setSelectedTotalCalories(fullMealData.totalCalories);
    setIsPopupOpen(true);
  };

  const liveProgressLabel = serviceTimeline.progressPercent.toFixed(10);

  return (
    <div className="w-full space-y-10 sm:space-y-12 lg:space-y-16">
      <section className="relative">
        <div className="max-w-3xl">
          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tighter text-on-surface dark:text-white sm:text-5xl lg:mb-6 lg:text-[3.5rem]">
            군 생활
            <br />
            <span className="text-primary dark:text-blue-400">통합 브리핑.</span>
          </h1>
          <p className="flex max-w-3xl flex-col text-base leading-relaxed text-on-surface-variant dark:text-slate-400 sm:text-lg">
            <span>일정, 식단, 국방 뉴스를 한눈에 확인하세요.</span>
            <span>최신 정보가 확인되는 즉시 업데이트됩니다.</span>
          </p>
        </div>
        <div className="absolute -right-6 top-0 -z-10 h-48 w-48 rounded-full signature-gradient opacity-10 blur-[72px] sm:-right-12 sm:-top-6 sm:h-72 sm:w-72 lg:-right-20 lg:-top-10 lg:h-96 lg:w-96 lg:blur-[100px]"></div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-12 lg:gap-8">
        <div
          ref={servicePanelRef}
          className="flex flex-col justify-between space-y-6 rounded-xl border border-transparent bg-surface-container-lowest p-5 shadow-[0_12px_40px_rgba(27,28,28,0.06)] transition-all dark:border-slate-800 dark:bg-slate-900/50 sm:p-6 md:col-span-7 lg:col-span-8 lg:space-y-8 lg:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary dark:text-blue-400">
                복무 현황
              </span>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">전역 계산기</h2>
              <p className="mt-2 text-sm text-on-surface-variant dark:text-slate-400">
                {serviceTimeline.subjectLabel}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 dark:bg-slate-800">
              <span className="material-symbols-outlined text-sm text-primary dark:text-blue-400" translate="no">
                timer
              </span>
              <span className="text-sm font-semibold text-on-surface dark:text-white">
                {serviceTimeline.dDayLabel}
              </span>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant dark:text-slate-400">
                복무 구분
              </p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <p className="text-sm font-semibold text-on-surface dark:text-white">
                  {serviceTimeline.serviceLabel}
                </p>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary dark:bg-blue-500/10 dark:text-blue-300">
                  {serviceTimeline.serviceDurationLabel}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant dark:text-slate-400">
                현재 계급/직급
              </p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <p className="text-sm font-semibold text-on-surface dark:text-white">
                  {serviceTimeline.displayRankLabel}
                </p>
                {serviceTimeline.usesAcquaintance ? (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                    지인 기준
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1 space-y-2">
                <label className="ml-1 text-xs font-medium text-on-surface-variant dark:text-slate-400">
                  입대일/임용일
                </label>
                <input
                  className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-white"
                  type="text"
                  value={serviceTimeline.enlistmentLabel}
                  readOnly
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="ml-1 text-xs font-medium text-on-surface-variant dark:text-slate-400">
                  전역일
                </label>
                <input
                  className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-white"
                  type="text"
                  value={serviceTimeline.dischargeLabel}
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">
                  복무율
                </span>
                <span className="inline-flex min-w-[14ch] justify-end font-mono text-3xl font-extrabold tracking-tighter text-primary tabular-nums dark:text-blue-400 sm:text-4xl">
                  {liveProgressLabel}
                  <span className="ml-1 text-lg sm:text-xl">%</span>
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-low dark:bg-slate-800">
                <div
                  className="h-full rounded-full signature-gradient transition-[width] duration-700 ease-out"
                  style={{ width: `${visualProgressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                {serviceTimeline.helperText}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-transparent bg-surface-container-lowest p-5 shadow-[0_12px_40px_rgba(27,28,28,0.06)] transition-all dark:border-slate-800 dark:bg-slate-900/50 sm:p-6 md:col-span-5 lg:col-span-4 lg:p-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined rounded-lg bg-primary-fixed p-2 text-primary dark:bg-blue-900/40 dark:text-blue-400" translate="no">
              military_tech
            </span>
            <h2 className="text-xl font-bold text-on-surface dark:text-white">예비군 현황</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="mb-1 text-xs text-on-surface-variant dark:text-slate-400">현재 상태</p>
              <p className="text-xl font-bold dark:text-white">예비군 1년차</p>
            </div>
            <div className="space-y-4 rounded-lg bg-surface-container-low p-4 dark:bg-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold dark:text-white">동원훈련</p>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">2024. 09. 12 - 09. 14</p>
                </div>
                <span className="rounded bg-tertiary-container px-2 py-1 text-[10px] font-bold text-on-tertiary-container dark:bg-slate-700 dark:text-slate-200">
                  대기 중
                </span>
              </div>
              <div className="border-t border-outline-variant/15 pt-3 dark:border-slate-700">
                <p className="text-xs text-on-surface-variant dark:text-slate-400">장소: 파주 예비군 훈련장</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-transparent bg-surface-container-low p-5 transition-all dark:border-slate-800 dark:bg-slate-900/50 sm:p-6 md:col-span-5 lg:col-span-4 lg:p-8">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">오늘의 식단</h2>
          </div>
          {mealError ? (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {mealError}
            </p>
          ) : null}
          <div className="space-y-4">
            <div
              className="group -mx-2 flex cursor-pointer items-start justify-between rounded-lg p-2 transition-colors hover:bg-surface-variant/30"
              onClick={() => handleMealClick('조식', fullMealData.breakfastItems)}
            >
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <span className="w-16 shrink-0 text-xs font-bold text-primary dark:text-blue-400">조식</span>
                <p className="line-clamp-2 text-sm text-on-surface transition-colors group-hover:text-primary dark:text-slate-200 dark:group-hover:text-blue-400">
                  {mealInfo.breakfast}
                </p>
              </div>
              <button className="flex text-on-surface-variant transition-colors group-hover:text-primary dark:text-slate-400 dark:group-hover:text-blue-400">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
            <div
              className="group -mx-2 flex cursor-pointer items-start justify-between rounded-lg border-y border-outline-variant/15 p-2 py-3 transition-colors hover:bg-surface-variant/30 dark:border-slate-800"
              onClick={() => handleMealClick('중식', fullMealData.lunchItems)}
            >
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <span className="w-16 shrink-0 text-xs font-bold text-primary dark:text-blue-400">중식</span>
                <p className="line-clamp-2 text-sm text-on-surface transition-colors group-hover:text-primary dark:text-slate-200 dark:group-hover:text-blue-400">
                  {mealInfo.lunch}
                </p>
              </div>
              <button className="flex text-on-surface-variant transition-colors group-hover:text-primary dark:text-slate-400 dark:group-hover:text-blue-400">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
            <div
              className="group -mx-2 flex cursor-pointer items-start justify-between rounded-lg p-2 transition-colors hover:bg-surface-variant/30"
              onClick={() => handleMealClick('석식', fullMealData.dinnerItems)}
            >
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <span className="w-16 shrink-0 text-xs font-bold text-primary dark:text-blue-400">석식</span>
                <p className="line-clamp-2 text-sm text-on-surface transition-colors group-hover:text-primary dark:text-slate-200 dark:group-hover:text-blue-400">
                  {mealInfo.dinner}
                </p>
              </div>
              <button className="flex text-on-surface-variant transition-colors group-hover:text-primary dark:text-slate-400 dark:group-hover:text-blue-400">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => navigate('/Meal')}
            className="mt-auto flex items-center gap-1 pt-6 text-sm font-bold text-primary transition-all hover:gap-2 dark:text-blue-400"
          >
            전체 식단 보기 <span className="material-symbols-outlined text-sm" translate="no">arrow_forward</span>
          </button>
        </div>

        <div className="rounded-xl border border-transparent bg-surface-container-lowest p-5 shadow-[0_12px_40px_rgba(27,28,28,0.06)] transition-all dark:border-slate-800 dark:bg-slate-900/50 sm:p-6 md:col-span-7 lg:col-span-8 lg:p-8">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">국방 뉴스</h2>
            <button
              onClick={() => navigate('/News')}
              className="text-xs font-bold text-on-surface-variant hover:text-primary dark:text-slate-400 dark:hover:text-blue-400"
            >
              전체보기
            </button>
          </div>
          {newsError ? (
            <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {newsError}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            {isNewsLoading ? (
              [1, 2, 3, 4].map((index) => (
                <div key={index} className="flex animate-pulse items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-surface-container-low dark:bg-slate-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-surface-container-low dark:bg-slate-800"></div>
                    <div className="h-3 w-1/2 rounded bg-surface-container-low dark:bg-slate-800"></div>
                  </div>
                </div>
              ))
            ) : newsList.length > 0 ? (
              newsList.map((item, index) => (
                <a
                  key={item.link || index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group -m-2 flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-surface-variant/30"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-low dark:bg-slate-800">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="material-symbols-outlined text-outline-variant" translate="no">
                          article
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-on-surface transition-colors group-hover:text-primary dark:text-slate-200 dark:group-hover:text-blue-400">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[10px] text-on-surface-variant dark:text-slate-500">
                      {item.pubDate}
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <p className="col-span-2 py-4 text-sm text-on-surface-variant dark:text-slate-500">
                표시할 뉴스가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      <MealPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        mealType={selectedMealType}
        dateLabel={todayDateLabel}
        items={selectedMealItems}
        totalCalories={selectedTotalCalories}
      />
    </div>
  );
};
