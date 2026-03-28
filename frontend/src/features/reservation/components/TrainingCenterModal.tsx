import React, { useEffect } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { clientEnv } from '../../../config/clientEnv';
import { TrainingCenter } from '../data/trainingCenters';
import {
  classifyKakaoMapFailure,
  getKakaoMapFailureDetails,
  getKakaoMapFallbackCopy,
  getKakaoMapSupportHint,
  reportKakaoMapFailure,
} from './kakaoMapDiagnostics';

interface TrainingCenterModalProps {
  center: TrainingCenter;
  onClose: () => void;
}

const KAKAO_MAP_KEY = clientEnv.kakaoMapKey;

const ModalMapFallback: React.FC<{
  message: string;
  supportHint?: string;
  details?: string | null;
}> = ({ message, supportHint, details }) => (
  <div className="rounded-xl bg-surface-container-low dark:bg-slate-800 aspect-[16/9] flex items-center justify-center border border-outline-variant/10 dark:border-slate-700">
    <div className="text-center text-on-surface-variant dark:text-slate-400 px-6">
      <span
        className="material-symbols-outlined text-5xl opacity-40 block mb-2"
        translate="no"
      >
        map
      </span>
      <p className="text-sm">{message}</p>
      {details ? (
        <p className="text-[11px] opacity-50 mt-2">{details}</p>
      ) : null}
      {supportHint ? (
        <p className="text-[11px] opacity-50 mt-2">{supportHint}</p>
      ) : null}
    </div>
  </div>
);

const TrainingCenterMap: React.FC<{
  center: TrainingCenter;
  hasCoords: boolean;
}> = ({ center, hasCoords }) => {
  const [loading, error] = useKakaoLoader({
    appkey: KAKAO_MAP_KEY,
  });
  const failureReason = classifyKakaoMapFailure(KAKAO_MAP_KEY, error);
  const fallbackCopy = getKakaoMapFallbackCopy(failureReason);
  const supportHint = getKakaoMapSupportHint(failureReason);
  const failureDetails = getKakaoMapFailureDetails(failureReason);

  useEffect(() => {
    if (!error) {
      return;
    }

    reportKakaoMapFailure('TrainingCenterModal', KAKAO_MAP_KEY, error);
  }, [error]);

  if (!hasCoords) {
    return (
      <ModalMapFallback message="Location data is not available for this training center." />
    );
  }

  if (error) {
    return (
      <ModalMapFallback
        message={fallbackCopy.title}
        supportHint={supportHint}
        details={failureDetails}
      />
    );
  }

  if (loading) {
    return <ModalMapFallback message="Loading the Kakao map..." />;
  }

  return (
    <div className="rounded-xl overflow-hidden aspect-[16/9] border border-outline-variant/10 dark:border-slate-700">
      <Map
        center={{ lat: center.lat, lng: center.lng }}
        level={4}
        style={{ width: '100%', height: '100%' }}
      >
        <MapMarker position={{ lat: center.lat, lng: center.lng }} />
      </Map>
    </div>
  );
};

export const TrainingCenterModal: React.FC<TrainingCenterModalProps> = ({
  center,
  onClose,
}) => {
  const zoneLabel = center.zones.join(', ');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const hasCoords = center.lat !== 0 && center.lng !== 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-surface-container-lowest dark:bg-slate-900 border-b border-outline-variant/10 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface dark:text-white tracking-tight">
              {center.name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-tertiary-container/30 dark:bg-slate-700/50 text-on-tertiary-fixed-variant dark:text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                {center.status}
              </span>
              <span className="text-sm text-on-surface-variant dark:text-slate-400 font-medium">
                {center.sido} {zoneLabel}
              </span>
              {center.distance != null && (
                <span className="text-sm text-primary dark:text-blue-400 font-bold">
                  {center.distance < 1
                    ? `${Math.round(center.distance * 1000)}m`
                    : `${center.distance.toFixed(1)}km`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors text-on-surface-variant dark:text-slate-400"
          >
            <span className="material-symbols-outlined text-2xl" translate="no">
              close
            </span>
          </button>
        </div>

        <div className="px-6 pt-4">
          {KAKAO_MAP_KEY ? (
            <TrainingCenterMap center={center} hasCoords={hasCoords} />
          ) : (
            <ModalMapFallback
              message={getKakaoMapFallbackCopy('missing_key').title}
              supportHint={getKakaoMapSupportHint('missing_key')}
            />
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low dark:bg-slate-800/50">
              <span
                className="material-symbols-outlined text-primary dark:text-blue-400 mt-0.5"
                translate="no"
              >
                location_on
              </span>
              <div>
                <p className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-1">
                  Address
                </p>
                <p className="text-sm text-on-surface dark:text-white">
                  {center.address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low dark:bg-slate-800/50">
              <span
                className="material-symbols-outlined text-primary dark:text-blue-400 mt-0.5"
                translate="no"
              >
                call
              </span>
              <div>
                <p className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-1">
                  Phone
                </p>
                <p className="text-sm text-on-surface dark:text-white">
                  {center.phone || 'Not available'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low dark:bg-slate-800/50 sm:col-span-2">
              <span
                className="material-symbols-outlined text-primary dark:text-blue-400 mt-0.5"
                translate="no"
              >
                badge
              </span>
              <div>
                <p className="text-xs font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-1">
                  Coverage
                </p>
                <p className="text-sm text-on-surface dark:text-white">
                  {zoneLabel}
                </p>
                {center.aliases.length > 1 && (
                  <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-2">
                    Aliases: {center.aliases.join(' / ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-slate-200 py-3 rounded-full text-sm font-bold hover:bg-surface-dim dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            <button className="flex-1 bg-primary text-on-primary py-3 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
              Request Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
