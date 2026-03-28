import React from 'react';

export interface MealItem {
  name: string;
  calorie: string; // "320 kcal" 형태로 들어옴
}

interface MealPopupProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: string;   // '조식', '중식', '석식'
  dateLabel: string;  // 예: '05.20' 또는 '2026.03.24'
  items: MealItem[];
  totalCalories: number;
}

export const MealPopup: React.FC<MealPopupProps> = ({
  isOpen,
  onClose,
  mealType,
  dateLabel,
  items,
  totalCalories
}) => {
  if (!isOpen) return null;

  const mealTotalCalories = items.reduce((acc, item) => {
    const num = parseFloat(item.calorie.replace(/[^0-9.]/g, '')) || 0;
    return acc + num;
  }, 0);
  const roundedMealTotal = Math.round(mealTotalCalories * 100) / 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] overflow-hidden border border-transparent dark:border-slate-800">
        {/* Modal Header */}
        <div className="p-6 flex justify-between items-start border-b border-surface-container-low dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary dark:text-blue-400 scale-75" translate="no">restaurant</span>
              <span className="text-xs font-bold text-primary dark:text-blue-400 tracking-widest uppercase">식단 상세</span>
            </div>
            <h2 className="text-2xl font-black text-on-surface dark:text-white tracking-tight">
              {mealType} 상세 정보 <span className="text-lg opacity-70">({dateLabel})</span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low dark:hover:bg-slate-800 rounded-full transition-colors flex"
          >
            <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400" translate="no">close</span>
          </button>
        </div>

        {/* Menu List */}
        <div className="p-6">
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {items.length > 0 ? items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary/40 dark:bg-blue-400/40 group-hover:bg-primary dark:group-hover:bg-blue-400 transition-colors"></div>
                  <span className="font-medium text-on-surface dark:text-slate-200">{item.name}</span>
                </div>
                <span className="text-on-surface-variant dark:text-slate-400 font-medium whitespace-nowrap">{item.calorie}</span>
              </div>
            )) : (
              <div className="text-center text-on-surface-variant py-4">식단 정보가 없습니다.</div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
            <span className="text-sm font-bold text-on-surface dark:text-slate-300">{mealType} 총 칼로리</span>
            <span className="text-lg font-bold text-primary dark:text-blue-400">{roundedMealTotal.toLocaleString()} kcal</span>
          </div>

          {/* Total Calorie Bar */}
          <div className="mt-8 pt-6 border-t border-surface-container-low dark:border-slate-800">
            <div className="flex justify-between items-end">
              <span className="text-on-surface-variant dark:text-slate-400 font-bold text-sm uppercase">총 섭취 칼로리</span>
              <div className="text-right flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary dark:text-blue-400">
                  {totalCalories.toLocaleString()}
                </span>
                <span className="text-on-surface-variant dark:text-slate-400 font-bold text-lg">kcal</span>
              </div>
            </div>
            {/*
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button className="py-3 px-4 bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-white font-bold rounded-xl text-sm hover:opacity-80 transition-opacity">
                영양 정보
              </button>
              <button className="py-3 px-4 bg-primary dark:bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
                식단 기록
              </button>
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
};
