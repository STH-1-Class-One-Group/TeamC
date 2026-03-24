import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MealPopup, MealItem } from './components/MealPopup';

interface MealData {
  dates: string;
  brst?: string;
  brst_cal?: string;
  lnch?: string;
  lnch_cal?: string;
  dnr?: string;
  dnr_cal?: string;
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
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[today.getDay()];
  return `${year}-${month}-${day}(${dayName})`;
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [mealInfo, setMealInfo] = useState({ breakfast: '불러오는 중...', lunch: '불러오는 중...', dinner: '불러오는 중...' });
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
    totalCalories: 0
  });

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    const fetchMeals = async () => {
      try {
        // FastAPI 백엔드를 통해 Cloudflare KV에서 식단 데이터 가져오기
        const todayDate = getTodayString();
        const response = await fetch(`${apiUrl}/api/v1/meals/${todayDate}`);

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const result: MealApiResponse = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
          throw new Error('No data available');
        }

        processMealData(result.data);
      } catch (error) {
        console.error('[DashboardPage] 식단 데이터 로드 실패, fallback 사용:', error);
        // fallback: 백엔드 연결 실패 시 기본 데이터 표시
        const todayDisplay = getTodayDisplayString();
        const fallbackData: MealData[] = [
          {"dates": todayDisplay, "brst": "밥", "brst_cal": "374.13kcal", "lnch": "밥", "lnch_cal": "374.13kcal", "dnr": "밥", "dnr_cal": "374.13kcal", "sum_cal": "2961.19kcal"},
          {"dates": todayDisplay, "brst": "참치 고추장찌개(05)(06)(09)(16)", "brst_cal": "148.73kcal", "lnch": "황태채미역국(05)(06)(16)", "lnch_cal": "41.88kcal", "dnr": "닭볶음탕(05)(15)", "dnr_cal": "451.14kcal", "sum_cal": "2961.19kcal"},
          {"dates": todayDisplay, "brst": "새송이버섯야채볶음(05)(06)(10)(18)", "brst_cal": "111.5kcal", "lnch": "사천식캐슈넛멸치볶음(04)(05)", "lnch_cal": "102.06kcal", "dnr": "사골우거지국(02)(05)(06)(16)(18)", "dnr_cal": "164.58kcal", "sum_cal": "2961.19kcal"},
          {"dates": todayDisplay, "brst": "계란말이(완)(01)(05)(12)", "brst_cal": "106kcal", "lnch": "고추장돼지불고기(완제품)(05)(10)", "lnch_cal": "482.33kcal", "dnr": "느타리버섯볶음(05)", "dnr_cal": "37.98kcal", "sum_cal": "2961.19kcal"},
          {"dates": todayDisplay, "brst": "배추김치(수의계약)", "brst_cal": "13.8kcal", "lnch": "배추김치(수의계약)", "lnch_cal": "13.8kcal", "dnr": "토핑형발효유(02)(06)", "dnr_cal": "165kcal", "sum_cal": "2961.19kcal"},
          {"dates": todayDisplay, "brst": "", "brst_cal": "", "lnch": "", "lnch_cal": "", "dnr": "배추김치", "dnr_cal": "0kcal", "sum_cal": "2961.19kcal"},
        ];
        processMealData(fallbackData);
      }
    };

    const fetchNews = async () => {
      try {
        setIsNewsLoading(true);
        const response = await fetch(`${apiUrl}/api/v1/news`);
        if (!response.ok) throw new Error('News fetch failed');
        const data = await response.json();
        setNewsList(data);
      } catch (error) {
        console.error('[DashboardPage] 뉴스 데이터 로드 실패:', error);
      } finally {
        setIsNewsLoading(false);
      }
    };

    const processMealData = (data: any[]) => {
      const cleanString = (str?: string) => str ? str.replace(/\([^)]*\)/g, '').trim() : '';

      let zeroCalCount = 0;
      let sumCalBase = 0;
      let currentDateLabel = getTodayDisplayString();

      if (data.length > 0) {
        currentDateLabel = data[0].dates || currentDateLabel;
        setTodayDateLabel(currentDateLabel);
        const firstSumCalStr = data[0].sum_cal || "0";
        sumCalBase = parseFloat(firstSumCalStr.replace(/[^0-9.]/g, '')) || 0;
      } else {
        setTodayDateLabel(currentDateLabel);
      }

      const parseItemAndCalorie = (nameStr?: string, calStr?: string): MealItem | null => {
        const name = cleanString(nameStr);
        if (!name) return null;
        
        let calVal = calStr ? calStr.trim() : "";
        if (calVal === "" || calVal === "0kcal") {
          calVal = "53kcal";
          zeroCalCount++;
        }
        return { name, calorie: calVal };
      };

      const bItems: MealItem[] = [];
      const lItems: MealItem[] = [];
      const dItems: MealItem[] = [];

      data.forEach(item => {
        const b = parseItemAndCalorie(item.brst, item.brst_cal);
        if (b) bItems.push(b);
        
        const l = parseItemAndCalorie(item.lnch || item.lunc, item.lnch_cal || item.lunc_cal);
        if (l) lItems.push(l);
        
        const d = parseItemAndCalorie(item.dnr || item.dinr, item.dnr_cal || item.dinr_cal);
        if (d) dItems.push(d);
      });

      const adjustedTotalCalories = Math.round((sumCalBase + (zeroCalCount * 53)) * 100) / 100;

      setFullMealData({
        breakfastItems: bItems,
        lunchItems: lItems,
        dinnerItems: dItems,
        totalCalories: adjustedTotalCalories
      });

      setMealInfo({
        breakfast: bItems.length > 0 ? bItems.map(i => i.name).join(', ') : '메뉴 없음',
        lunch: lItems.length > 0 ? lItems.map(i => i.name).join(', ') : '메뉴 없음',
        dinner: dItems.length > 0 ? dItems.map(i => i.name).join(', ') : '메뉴 없음'
      });
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
      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-3xl">
          <h1 className="text-[3.5rem] font-extrabold tracking-tighter leading-tight text-on-surface dark:text-white mb-6">
            당신의 군 생활을 위한<br/>
            <span className="text-primary dark:text-blue-400">통합 지휘 본부.</span>
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg leading-relaxed max-w-3xl flex flex-col">
            <span>효율적인 일정 관리와 최신 국방 정보, 맞춤형 서비스를 한곳에서 제어하십시오.</span> 
            <span>현대적이고 직관적인 센티넬 대시보드입니다.</span>
          </p>
        </div>
        {/* Decorative Element */}
        <div className="absolute -top-10 -right-20 w-96 h-96 signature-gradient opacity-10 rounded-full blur-[100px] -z-10"></div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Discharge Calculator */}
        <div className="md:col-span-8 bg-surface-container-lowest dark:bg-slate-900/50 p-8 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] flex flex-col justify-between space-y-8 border border-transparent dark:border-slate-800 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-primary dark:text-blue-400 tracking-widest uppercase mb-2 block">Personnel Status</span>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">군대전역일 계산기</h2>
            </div>
            <div className="bg-surface-container-low dark:bg-slate-800 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="material-symbols-outlined text-primary dark:text-blue-400 text-sm" translate="no">timer</span>
              <span className="text-sm font-semibold text-on-surface dark:text-white">D-184</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-on-surface-variant dark:text-slate-400 ml-1">입대일</label>
                <input className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg py-3 px-4 focus:ring-1 focus:ring-primary text-on-surface dark:text-white text-sm" type="text" defaultValue="2023. 05. 08" readOnly />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-on-surface-variant dark:text-slate-400 ml-1">전역일</label>
                <input className="w-full bg-surface-container-low dark:bg-slate-800 border-none rounded-lg py-3 px-4 focus:ring-1 focus:ring-primary text-on-surface dark:text-white text-sm" type="text" defaultValue="2024. 11. 07" readOnly />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">복무율</span>
                <span className="text-4xl font-extrabold text-primary dark:text-blue-400 tracking-tighter">68.4<span className="text-xl">%</span></span>
              </div>
              <div className="w-full h-3 bg-surface-container-low dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full signature-gradient rounded-full" style={{ width: '68.4%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Reservist Status */}
        <div className="md:col-span-4 bg-surface-container-lowest dark:bg-slate-900/50 p-8 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] border border-transparent dark:border-slate-800 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary dark:text-blue-400 bg-primary-fixed dark:bg-blue-900/40 p-2 rounded-lg" translate="no">military_tech</span>
            <h2 className="text-xl font-bold text-on-surface dark:text-white">예비군 훈련 현황</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-1">현재 연차</p>
              <p className="text-xl font-bold dark:text-white">전역 1년차 (희망배정)</p>
            </div>
            <div className="p-4 bg-surface-container-low dark:bg-slate-800 rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold dark:text-white">동원훈련 (2박 3일)</p>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">2024. 09. 12 ~ 09. 14</p>
                </div>
                <span className="bg-tertiary-container dark:bg-slate-700 text-on-tertiary-container dark:text-slate-200 px-2 py-1 rounded text-[10px] font-bold">대기중</span>
              </div>
              <div className="border-t border-outline-variant/15 dark:border-slate-700 pt-3">
                <p className="text-xs text-on-surface-variant dark:text-slate-400">장소: 경기도 파주시 예비군 훈련장</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meal Plan */}
        <div className="md:col-span-4 bg-surface-container-low dark:bg-slate-900/50 p-8 rounded-xl flex flex-col border border-transparent dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">오늘 무엇을 먹나요?</h2>
          </div>
          <div className="space-y-4">
            <div 
              className="flex items-center justify-between cursor-pointer group hover:bg-surface-variant/30 p-2 rounded-lg transition-colors -mx-2"
              onClick={() => handleMealClick('조식', fullMealData.breakfastItems)}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-8">조식</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{mealInfo.breakfast}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
            <div 
              className="flex items-center justify-between py-3 border-y border-outline-variant/15 dark:border-slate-800 cursor-pointer group hover:bg-surface-variant/30 p-2 rounded-lg transition-colors -mx-2"
              onClick={() => handleMealClick('중식', fullMealData.lunchItems)}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-8">중식</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{mealInfo.lunch}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer group hover:bg-surface-variant/30 p-2 rounded-lg transition-colors -mx-2"
              onClick={() => handleMealClick('석식', fullMealData.dinnerItems)}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-8">석식</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{mealInfo.dinner}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
          </div>
          <button 
            onClick={() => navigate('/Meal')}
            className="mt-auto pt-6 text-sm font-bold text-primary dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all">
            전체 식단표 보기 <span className="material-symbols-outlined text-sm" translate="no">arrow_forward</span>
          </button>
        </div>

        {/* Defense News Section */}
        <div className="md:col-span-8 bg-surface-container-lowest dark:bg-slate-900/50 p-8 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] border border-transparent dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">국방 뉴스 섹션</h2>
            <button 
               onClick={() => navigate('/News')}
               className="text-xs font-bold text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-blue-400">
               전체보기
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {isNewsLoading ? (
              <div className="col-span-2 text-center py-10 text-on-surface-variant dark:text-slate-400">뉴스를 불러오는 중입니다...</div>
            ) : newsList.length > 0 ? (
              newsList.map((news, idx) => (
                <div 
                  key={idx} 
                  className="group cursor-pointer"
                  onClick={() => window.open(news.link, '_blank')}
                >
                  <div className="aspect-video w-full rounded-lg bg-surface-dim dark:bg-slate-800 mb-4 overflow-hidden">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      src={news.thumbnail && news.thumbnail !== "https://via.placeholder.com/300x200?text=No+Image" ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/news/image?url=${encodeURIComponent(news.thumbnail)}` : "https://szpwchwghfsswtdrtrmr.supabase.co/storage/v1/object/public/food-media/thumbnail.png"} 
                      alt={news.title} 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://szpwchwghfsswtdrtrmr.supabase.co/storage/v1/object/public/food-media/thumbnail.png";
                      }}
                    />
                  </div>
                  <h3 
                    className="text-base font-bold text-on-surface dark:text-white leading-snug group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: news.title }}
                  />
                  <p className="text-xs text-on-surface-variant dark:text-slate-500 mt-2">{news.pubDate}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-10 text-on-surface-variant dark:text-slate-400">최근 국방 뉴스가 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {/* 식단 팝업 컴포넌트 */}
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
