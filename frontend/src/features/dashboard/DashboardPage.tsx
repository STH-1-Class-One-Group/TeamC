import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MealPopup, MealItem } from './components/MealPopup';
import { fetchNewsBatch } from '../news/newsApi';
import { Profile } from '../../components/common/ProfileSetupModal';
import { calculateServiceTimeline } from '../../utils/serviceDates';

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
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[today.getDay()];
  return `${year}-${month}-${day}(${dayName})`;
};

const FALLBACK_MEALS = (todayDisplay: string): MealData[] => [
  { dates: todayDisplay, brst: 'Rice', brst_cal: '374.13kcal', lnch: 'Rice', lnch_cal: '374.13kcal', dnr: 'Rice', dnr_cal: '374.13kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: 'Tuna pepper salad', brst_cal: '148.73kcal', lnch: 'Vegetable soup', lnch_cal: '41.88kcal', dnr: 'Sweet pumpkin', dnr_cal: '451.14kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: 'Seasoned greens', brst_cal: '111.5kcal', lnch: 'Stir-fried anchovy', lnch_cal: '102.06kcal', dnr: 'Beef radish soup', dnr_cal: '164.58kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: 'Steamed egg', brst_cal: '106kcal', lnch: 'Stir-fried pork', lnch_cal: '482.33kcal', dnr: 'Pickles', dnr_cal: '37.98kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: 'Kimchi', brst_cal: '13.8kcal', lnch: 'Kimchi', lnch_cal: '13.8kcal', dnr: 'Flavored milk', dnr_cal: '165kcal', sum_cal: '2961.19kcal' },
  { dates: todayDisplay, brst: '', brst_cal: '', lnch: '', lnch_cal: '', dnr: 'Kimchi', dnr_cal: '0kcal', sum_cal: '2961.19kcal' },
];

const DEFAULT_MEAL_INFO = {
  breakfast: 'Loading...',
  lunch: 'Loading...',
  dinner: 'Loading...',
};

interface DashboardPageProps {
  profile: Profile | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ profile }) => {
  const navigate = useNavigate();
  const didInitRef = useRef(false);
  const serviceTimeline = calculateServiceTimeline(profile?.enlistment_date);

  const [mealInfo, setMealInfo] = useState(DEFAULT_MEAL_INFO);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

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
    if (didInitRef.current) {
      return;
    }
    didInitRef.current = true;
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
        breakfast: breakfastItems.length > 0 ? breakfastItems.map((entry) => entry.name).join(', ') : 'No menu',
        lunch: lunchItems.length > 0 ? lunchItems.map((entry) => entry.name).join(', ') : 'No menu',
        dinner: dinnerItems.length > 0 ? dinnerItems.map((entry) => entry.name).join(', ') : 'No menu',
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
      try {
        const todayDate = getTodayString();
        const response = await fetch(`${apiUrl}/api/v1/meals/${todayDate}`);
        if (!response.ok) {
          throw new Error('Failed to fetch meals');
        }

        const result: MealApiResponse = await response.json();
        if (!result.success || !result.data || result.data.length === 0) {
          throw new Error('No meal data available');
        }

        await processMealData(result.data);
      } catch (error) {
        console.error('[DashboardPage] meal fetch failed, using fallback:', error);
        await processMealData(FALLBACK_MEALS(getTodayDisplayString()));
      }
    };

    const fetchNews = async () => {
      setIsNewsLoading(true);
      setNewsList([]);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetchNewsBatch(4, 1, {
          signal: controller.signal,
          forceRefresh: false,
        });
        if (!response.ok) {
          throw new Error('Failed to fetch defense news');
        }

        const data: NewsItem[] = await response.json();
        const uniqueNews = data.filter(
          (item, index, array) => item.link && array.findIndex((candidate) => candidate.link === item.link) === index
        );
        setNewsList(uniqueNews);
      } catch (error) {
        console.error('[DashboardPage] news fetch failed:', error);
      } finally {
        window.clearTimeout(timeoutId);
        setIsNewsLoading(false);
      }
    };

    fetchMeals();
    fetchNews();
  }, []);

  const handleMealClick = (mealType: string, items: MealItem[]) => {
    setSelectedMealType(mealType);
    setSelectedMealItems(items);
    setSelectedTotalCalories(fullMealData.totalCalories);
    setIsPopupOpen(true);
  };

  return (
    <div className="space-y-16 w-full">
      <section className="relative">
        <div className="max-w-3xl">
          <h1 className="text-[3.5rem] font-extrabold tracking-tighter leading-tight text-on-surface dark:text-white mb-6">
            Military Life
            <br />
            <span className="text-primary dark:text-blue-400">Integrated Briefing.</span>
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg leading-relaxed max-w-3xl flex flex-col">
            <span>Schedules, meals, and defense news are surfaced from one dashboard.</span>
            <span>Loaded items appear as soon as they arrive.</span>
          </p>
        </div>
        <div className="absolute -top-10 -right-20 w-96 h-96 signature-gradient opacity-10 rounded-full blur-[100px] -z-10"></div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 bg-surface-container-lowest dark:bg-slate-900/50 p-8 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] flex flex-col justify-between space-y-8 border border-transparent dark:border-slate-800 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-primary dark:text-blue-400 tracking-widest uppercase mb-2 block">Personnel Status</span>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">Discharge Calculator</h2>
            </div>
            <div className="bg-surface-container-low dark:bg-slate-800 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="material-symbols-outlined text-primary dark:text-blue-400 text-sm" translate="no">timer</span>
              <span className="text-sm font-semibold text-on-surface dark:text-white">{serviceTimeline.dDayLabel}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-on-surface-variant dark:text-slate-400 ml-1">Enlistment</label>
                <input
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg py-3 px-4 focus:ring-1 focus:ring-primary text-on-surface dark:text-white text-sm"
                  type="text"
                  value={serviceTimeline.enlistmentLabel}
                  readOnly
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-on-surface-variant dark:text-slate-400 ml-1">Discharge</label>
                <input
                  className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg py-3 px-4 focus:ring-1 focus:ring-primary text-on-surface dark:text-white text-sm"
                  type="text"
                  value={serviceTimeline.dischargeLabel}
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">Progress</span>
                <span className="text-4xl font-extrabold text-primary dark:text-blue-400 tracking-tighter">
                  {serviceTimeline.progressPercent.toFixed(1)}
                  <span className="text-xl">%</span>
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container-low dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full signature-gradient rounded-full"
                  style={{ width: `${serviceTimeline.progressPercent.toFixed(1)}%` }}
                ></div>
              </div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                {serviceTimeline.helperText}
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest dark:bg-slate-900/50 p-8 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] border border-transparent dark:border-slate-800 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary dark:text-blue-400 bg-primary-fixed dark:bg-blue-900/40 p-2 rounded-lg" translate="no">military_tech</span>
            <h2 className="text-xl font-bold text-on-surface dark:text-white">Reservist Status</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-1">Current grade</p>
              <p className="text-xl font-bold dark:text-white">Reserve 1st class</p>
            </div>
            <div className="p-4 bg-surface-container-low dark:bg-slate-800 rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold dark:text-white">Mobilization training</p>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">2024. 09. 12 - 09. 14</p>
                </div>
                <span className="bg-tertiary-container dark:bg-slate-700 text-on-tertiary-container dark:text-slate-200 px-2 py-1 rounded text-[10px] font-bold">Pending</span>
              </div>
              <div className="border-t border-outline-variant/15 dark:border-slate-700 pt-3">
                <p className="text-xs text-on-surface-variant dark:text-slate-400">Location: Paju reserve training unit</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-low dark:bg-slate-900/50 p-8 rounded-xl flex flex-col border border-transparent dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">Today's Meals</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between cursor-pointer group hover:bg-surface-variant/30 p-2 rounded-lg transition-colors -mx-2" onClick={() => handleMealClick('Breakfast', fullMealData.breakfastItems)}>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-16">Breakfast</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{mealInfo.breakfast}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-y border-outline-variant/15 dark:border-slate-800 cursor-pointer group hover:bg-surface-variant/30 p-2 rounded-lg transition-colors -mx-2" onClick={() => handleMealClick('Lunch', fullMealData.lunchItems)}>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-16">Lunch</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{mealInfo.lunch}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center justify-between cursor-pointer group hover:bg-surface-variant/30 p-2 rounded-lg transition-colors -mx-2" onClick={() => handleMealClick('Dinner', fullMealData.dinnerItems)}>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-16">Dinner</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{mealInfo.dinner}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
          </div>
          <button onClick={() => navigate('/Meal')} className="mt-auto pt-6 text-sm font-bold text-primary dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all">
            View full meals <span className="material-symbols-outlined text-sm" translate="no">arrow_forward</span>
          </button>
        </div>

        <div className="md:col-span-8 bg-surface-container-lowest dark:bg-slate-900/50 p-8 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] border border-transparent dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">Defense News</h2>
            <button onClick={() => navigate('/News')} className="text-xs font-bold text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-blue-400">
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {newsList.length > 0 ? (
              newsList.map((news, idx) => (
                <div key={news.link || idx} className="group cursor-pointer" onClick={() => window.open(news.link, '_blank')}>
                  <div className="aspect-video w-full rounded-lg bg-surface-dim dark:bg-slate-800 mb-4 overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={
                        news.thumbnail && news.thumbnail !== 'https://via.placeholder.com/300x200?text=No+Image'
                          ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/news/image?url=${encodeURIComponent(news.thumbnail)}`
                          : 'https://szpwchwghfsswtdrtrmr.supabase.co/storage/v1/object/public/food-media/thumbnail.png'
                      }
                      alt={news.title}
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src =
                          'https://szpwchwghfsswtdrtrmr.supabase.co/storage/v1/object/public/food-media/thumbnail.png';
                      }}
                    />
                  </div>
                  <h3 className="text-base font-bold text-on-surface dark:text-white leading-snug group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-500 mt-2">{news.pubDate}</p>
                </div>
              ))
            ) : isNewsLoading ? (
              <div className="col-span-2 text-center py-10 text-on-surface-variant dark:text-slate-400">Loading news...</div>
            ) : (
              <div className="col-span-2 text-center py-10 text-on-surface-variant dark:text-slate-400">No defense news available.</div>
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
