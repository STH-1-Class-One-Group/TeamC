import React from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-16 w-full">
        {/* Hero Section */}
        <section className="relative">
          <div className="max-w-3xl">
            <h1 className="text-[3.5rem] font-extrabold tracking-tighter leading-tight text-on-surface dark:text-white mb-6">
              당신의 군 생활을 위한<br/>
              <span className="text-primary dark:text-blue-400">통합 지휘 본부.</span>
            </h1>
            <p className="text-on-surface-variant dark:text-slate-400 text-lg leading-relaxed max-w-xl">
              효율적인 일정 관리와 최신 국방 정보, 맞춤형 서비스를 한곳에서 제어하십시오. 현대적이고 직관적인 센티넬 대시보드입니다.
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
                  <p className="text-sm text-on-surface dark:text-slate-200">쌀밥, 미역국, 제육볶음, 김치</p>
                </div>
                <button className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex">
                  <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-y border-outline-variant/15 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-primary dark:text-blue-400 w-8">중식</span>
                  <p className="text-sm text-on-surface dark:text-slate-200">잡곡밥, 육개장, 돈까스, 샐러드</p>
                </div>
                <button className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex">
                  <span className="material-symbols-outlined text-lg" translate="no">chevron_right</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-primary dark:text-blue-400 w-8">석식</span>
                  <p className="text-sm text-on-surface dark:text-slate-200">비빔밥, 된장찌개, 계란말이</p>
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
      </main>
      <Footer />
    </div>
  );
};

export default App;
