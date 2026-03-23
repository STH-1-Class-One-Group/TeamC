import React, { useState, useEffect } from 'react';

interface MealData {
  dates: string;
  brst?: string;
  brst_cal?: string;
  lunc?: string;
  lnch?: string;
  lunc_cal?: string;
  lnch_cal?: string;
  dinr?: string;
  dnr?: string;
  dinr_cal?: string;
  dnr_cal?: string;
  sum_cal?: string;
}

const fallbackData: MealData[] = [
   {"dates":"2024-09-01(일)","brst":"밥","brst_cal":"374.13kcal","lunc":"밥","lunc_cal":"374.13kcal","dinr":"밥","dinr_cal":"374.13kcal","sum_cal":"2961.19kcal"},
   {"dates":"2024-09-01(일)","brst":"참치 고추장찌개(05)(06)(09)(16)","brst_cal":"148.73kcal","lunc":"황태채미역국(05)(06)(16)","lunc_cal":"41.88kcal","dinr":"닭볶음탕(05)(15)","dinr_cal":"451.14kcal","sum_cal":"2961.19kcal"},
   {"dates":"2024-09-01(일)","brst":"새송이버섯야채볶음(05)(06)(10)(18)","brst_cal":"111.5kcal","lunc":"사천식캐슈넛멸치볶음(04)(05)","lunc_cal":"102.06kcal","dinr":"사골우거지국(02)(05)(06)(16)(18)","dinr_cal":"164.58kcal","sum_cal":"2961.19kcal"},
   {"dates":"2024-09-01(일)","brst":"계란말이(완)(01)(05)(12)","brst_cal":"106kcal","lunc":"고추장돼지불고기(완제품)(05)(10)","lunc_cal":"482.33kcal","dinr":"느타리버섯볶음(05)","dinr_cal":"37.98kcal","sum_cal":"2961.19kcal"},
   {"dates":"2024-09-01(일)","brst":"배추김치(수의계약)","brst_cal":"13.8kcal","lunc":"배추김치(수의계약)","lunc_cal":"13.8kcal","dinr":"토핑형발효유(02)(06)","dinr_cal":"165kcal","sum_cal":"2961.19kcal"},
   {"dates":"2024-09-01(일)","brst":"","brst_cal":"","lunc":"","lunc_cal":"","dinr":"배추김치","dinr_cal":"0kcal","sum_cal":"2961.19kcal"}
];

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[today.getDay()];
  return `${year}-${month}-${day}(${dayName})`;
};

export const DashboardPage: React.FC = () => {
  const [mealInfo, setMealInfo] = useState({ breakfast: '불러오는 중...', lunch: '불러오는 중...', dinner: '불러오는 중...' });

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        // Attempt to fetch from Cloudflare KV Workers
        const response = await fetch('https://meals.7aae3335fb024377b2868d2b7833b765.workers.dev');
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        const data = await response.json();
        
        const todayStr = getTodayString();
        let todayData = (data.DATA || data).filter((item: MealData) => item.dates === todayStr);
        
        if (!todayData || todayData.length === 0) {
          throw new Error('No data for today');
        }
        processMealData(todayData);
      } catch (error) {
        const todayStr = getTodayString();
        const fallbackMapped = fallbackData.map(item => ({ ...item, dates: todayStr }));
        processMealData(fallbackMapped);
      }
    };

    const processMealData = (data: MealData[]) => {
      const cleanString = (str?: string) => str ? str.replace(/\([^)]*\)/g, '').trim() : '';

      const breakfastItems = data.map(item => cleanString(item.brst)).filter(item => item !== '');
      const lunchItems = data.map(item => cleanString(item.lunc || item.lnch)).filter(item => item !== '');
      const dinnerItems = data.map(item => cleanString(item.dinr || item.dnr)).filter(item => item !== '');
      
      setMealInfo({
        breakfast: breakfastItems.length > 0 ? breakfastItems.join(', ') : '메뉴 없음',
        lunch: lunchItems.length > 0 ? lunchItems.join(', ') : '메뉴 없음',
        dinner: dinnerItems.length > 0 ? dinnerItems.join(', ') : '메뉴 없음'
      });
    };

    fetchMeals();
  }, []);

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-8">조식</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all">{mealInfo.breakfast}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-y border-outline-variant/15 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-8">중식</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all">{mealInfo.lunch}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary dark:text-blue-400 w-8">석식</span>
                <p className="text-sm text-on-surface dark:text-slate-200 break-all">{mealInfo.dinner}</p>
              </div>
              <button className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex">
                <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
              </button>
            </div>
          </div>
          <button className="mt-auto pt-6 text-sm font-bold text-primary dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all">
            전체 식단표 보기 <span className="material-symbols-outlined text-sm" translate="no">arrow_forward</span>
          </button>
        </div>

        {/* Defense News Section */}
        <div className="md:col-span-8 bg-surface-container-lowest dark:bg-slate-900/50 p-8 rounded-xl shadow-[0_12px_40px_rgba(27,28,28,0.06)] border border-transparent dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">국방 뉴스 섹션</h2>
            <button className="text-xs font-bold text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-blue-400">전체보기</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: "차세대 주력 전차 K-3 개발 착수, 국방부 공식 발표", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCRa5qOGIkDJyWP3IL_0CcIcZbSZgBJCbS4xrLN5lsySdUc5V2HkIYLCsL5A42G1afKfh__mr43K2BJ6OQjQr-EhmUwV1NuQlhKc-l4-DETcGEgcYp8QRRNOFkFZ0s9k7MlYsN8laG9BeJjgJFrKQCZ7NbCgJPvUXz7iRqnxvd2WhxsUMVASDy0bnwZxlMjpNJbaSc4G2xdmxRkPRd4prujeom3kppvVLa532fTc9nxCc2xhwYj-ccihKtMrSqoUwIY3-rnvMq8A0l" },
              { title: "군 장병 복지 향상을 위한 '스마트 병영 2.0' 로드맵 공개", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjGNVtsQaHAlpv-j4_AciKjVdKqMEgE-UlO4QmbCZQo37bJUHttkXn8G6hDQSjpsdYKP4pVLBebEl27Vc4V79h2ipb0shxMdOzcSo1HV8vwaQ7VTN3khF6QqtVwVZ_QA2Ej84HcbRY-PTItre462C2Y94GQNw3dbxrSz1CCUf6ecB-enxIZTvcrpcg-UxX9DNW_b6My4110tsM2tMZ9bRBs4latlpSZNSSEDcvYfOfEz36qfgS-JUcMWyEDxsy3ptr7yLtb-H0JpaX" },
              { title: "한미 합동 공중 기동 훈련 실시, 최고 수준 경계 태세 유지", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUDHS7JbJvZ_2dIbzc8nuvElFWP_9oPsmK_A_3KYAA0HARntSYtTrs_TP2lYilULRaB6USJHdcc7Riif6wO1P_1iGOuyzYu3L97x5KNMiUa-P4w9bb6SmWwx3v1PAmRMtzkTzXnFkTYXVKhXk-burP5qcPWqFbteerJIbQT6PfZua3g1RoKPYYmq9byTdBw6dTh1c1kJEtPcWA6h7CxaqmPTqbZOcVjMJB5SpnM2-0IsiN66x4kHGCiiequJt-JGth_h5DLvF0MAOf" },
              { title: "내년부터 병 봉급 인상... 상병 기준 월 150만원 시대", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9cTB-vpNV_i6PHm-Xwqymu9BvIHjB5iTp4035_sJ5_tl36M10FbFWgpq65o21h2hgrcMA311TkjMkBTkEFh-424_hDDR9pfcQ8lAI-mhH8CDgnu3-N8ReBtmo1BXcfHVTWIz3btEhkCCb-2W8ITi_GnMONSuZ2Nkh4RwIs3hHjfmvrfFlAUzL7qgOuyLJmoihmvHU9DFXG-zxEcJswdJocPXK0cOLxqzijbL9iKC6Lr45GRz7D-78zRgyf6AYYPjfJH1XQm4_XrqI" }
            ].map((news, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="aspect-video w-full rounded-lg bg-surface-dim dark:bg-slate-800 mb-4 overflow-hidden">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={news.img} alt="News thumbnail" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-base font-bold text-on-surface dark:text-white leading-snug group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                  {news.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
