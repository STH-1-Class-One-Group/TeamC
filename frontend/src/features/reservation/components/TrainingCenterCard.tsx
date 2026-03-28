import React from 'react';
import { TrainingCenter } from '../data/trainingCenters';

interface TrainingCenterCardProps {
  center: TrainingCenter;
  onPreviewClick?: (center: TrainingCenter) => void;
  onDetailClick?: (center: TrainingCenter) => void;
  isHighlighted?: boolean;
}

export const TrainingCenterCard: React.FC<TrainingCenterCardProps> = ({
  center,
  onPreviewClick,
  onDetailClick,
  isHighlighted,
}) => {
  const zoneLabel =
    center.zones.length <= 2
      ? center.zones.join(', ')
      : `${center.zones.slice(0, 2).join(', ')} 외 ${center.zones.length - 2}곳`;

  return (
    <div
      data-center-id={center.id}
      className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all group ${
        isHighlighted
          ? 'bg-primary/5 dark:bg-blue-900/20 border-primary/30 dark:border-blue-500/30 ring-2 ring-primary/20 dark:ring-blue-500/20'
          : 'bg-surface-container-lowest dark:bg-slate-900/50 border-outline-variant/10 dark:border-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={() => onPreviewClick?.(center)}
        className="w-full text-left rounded-lg transition-colors hover:bg-surface-container-low/60 dark:hover:bg-slate-800/40 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-lg text-on-surface dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
              {center.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-tertiary-container/30 dark:bg-slate-700/50 text-on-tertiary-fixed-variant dark:text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                {center.status}
              </span>
              <span className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">
                {zoneLabel}
              </span>
              {center.distance != null && (
                <span className="text-xs text-primary dark:text-blue-400 font-bold">
                  {center.distance < 1 ? `${Math.round(center.distance * 1000)}m` : `${center.distance.toFixed(1)}km`}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant dark:text-slate-400 mb-2 line-clamp-1">
          {center.address}
        </p>
        {center.sourceCount > 1 && (
          <p className="text-xs text-on-surface-variant dark:text-slate-500 mb-2">
            관할 지역 {center.zones.length}곳 통합
          </p>
        )}
        {center.phone && (
          <p className="text-xs text-on-surface-variant dark:text-slate-500 mb-4">
            <span className="material-symbols-outlined text-xs align-middle mr-1" translate="no">call</span>
            {center.phone}
          </p>
        )}
      </button>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => onDetailClick?.(center)}
          className="flex-1 bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-slate-200 py-2.5 rounded-full text-sm font-bold hover:bg-surface-dim dark:hover:bg-slate-700 transition-colors"
        >
          상세보기
        </button>
        <button type="button" className="flex-1 bg-primary text-on-primary py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
          신청하기
        </button>
      </div>
    </div>
  );
};
