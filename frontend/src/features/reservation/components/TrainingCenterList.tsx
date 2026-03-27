import React, { useEffect, useRef } from 'react';
import { TrainingCenter } from '../data/trainingCenters';
import { TrainingCenterCard } from './TrainingCenterCard';

interface TrainingCenterListProps {
  centers: TrainingCenter[];
  isLoading: boolean;
  onDetailClick?: (center: TrainingCenter) => void;
  highlightedCenterId?: string | null;
}

export const TrainingCenterList: React.FC<TrainingCenterListProps> = ({ centers, isLoading, onDetailClick, highlightedCenterId }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightedCenterId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-center-id="${highlightedCenterId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedCenterId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold tracking-tight text-on-surface dark:text-white">주변 훈련장 목록</h3>
        <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">총 {centers.length}개 결과</span>
      </div>
      <div ref={listRef} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-on-surface-variant dark:text-slate-400">
            <span className="material-symbols-outlined animate-spin mr-2" translate="no">progress_activity</span>
            훈련장 정보를 불러오는 중...
          </div>
        ) : centers.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant dark:text-slate-400">
            <span className="material-symbols-outlined text-4xl opacity-40 block mb-2" translate="no">search_off</span>
            <p className="text-sm">해당 지역에 훈련장이 없습니다.</p>
          </div>
        ) : (
          centers.map((center) => (
            <TrainingCenterCard
              key={center.id}
              center={center}
              onDetailClick={onDetailClick}
              isHighlighted={highlightedCenterId === center.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
