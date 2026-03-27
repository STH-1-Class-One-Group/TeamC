import React, { useEffect, useMemo, useState } from 'react';
import { CustomOverlayMap, Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { TrainingCenter } from '../data/trainingCenters';

interface KakaoMapProps {
  centers: TrainingCenter[];
  focusedCenter?: TrainingCenter | null;
  onMarkerClick?: (center: TrainingCenter) => void;
  emptyMessage?: string;
}

const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY?.trim() || '';

export const KakaoMap: React.FC<KakaoMapProps> = ({
  centers,
  focusedCenter,
  onMarkerClick,
  emptyMessage,
}) => {
  const [loading, error] = useKakaoLoader({
    appkey: KAKAO_MAP_KEY,
  });
  const [mapCenter, setMapCenter] = useState({ lat: 36.5, lng: 127.5 });
  const [mapLevel, setMapLevel] = useState(12);
  const [infoCenter, setInfoCenter] = useState<TrainingCenter | null>(null);

  const validCenters = useMemo(
    () => centers.filter((center) => Number.isFinite(center.lat) && Number.isFinite(center.lng)),
    [centers]
  );

  useEffect(() => {
    if (validCenters.length === 0) {
      return;
    }

    if (validCenters.length === 1) {
      setMapCenter({ lat: validCenters[0].lat, lng: validCenters[0].lng });
      setMapLevel(5);
      return;
    }

    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;

    for (const center of validCenters) {
      minLat = Math.min(minLat, center.lat);
      maxLat = Math.max(maxLat, center.lat);
      minLng = Math.min(minLng, center.lng);
      maxLng = Math.max(maxLng, center.lng);
    }

    setMapCenter({
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    });

    const maxDiff = Math.max(maxLat - minLat, maxLng - minLng);
    if (maxDiff < 0.02) {
      setMapLevel(5);
    } else if (maxDiff < 0.05) {
      setMapLevel(6);
    } else if (maxDiff < 0.1) {
      setMapLevel(7);
    } else if (maxDiff < 0.3) {
      setMapLevel(8);
    } else if (maxDiff < 0.5) {
      setMapLevel(9);
    } else if (maxDiff < 1) {
      setMapLevel(10);
    } else {
      setMapLevel(11);
    }

    setInfoCenter(null);
  }, [validCenters]);

  useEffect(() => {
    if (!focusedCenter) {
      return;
    }

    setMapCenter({ lat: focusedCenter.lat, lng: focusedCenter.lng });
    setMapLevel(3);
    setInfoCenter(focusedCenter);
  }, [focusedCenter]);

  if (!KAKAO_MAP_KEY) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-surface-container-low dark:bg-slate-800 shadow-sm aspect-[16/9] border border-outline-variant/10 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center h-full text-on-surface-variant dark:text-slate-400 gap-3">
          <span className="material-symbols-outlined text-6xl opacity-40" translate="no">map</span>
          <p className="text-sm font-medium">카카오맵 API 키가 설정되지 않았습니다</p>
          <p className="text-xs opacity-60">REACT_APP_KAKAO_MAP_KEY 환경 변수를 설정해주세요</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-surface-container-low dark:bg-slate-800 shadow-sm aspect-[16/9] border border-outline-variant/10 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center h-full text-on-surface-variant dark:text-slate-400 gap-3 px-6 text-center">
          <span className="material-symbols-outlined text-6xl opacity-40" translate="no">map</span>
          <p className="text-sm font-medium">카카오맵을 불러오지 못했습니다</p>
          <p className="text-xs opacity-60">도메인 등록, 카카오맵 사용 설정, 네트워크 상태를 확인해주세요</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-surface-container-low dark:bg-slate-800 shadow-sm aspect-[16/9] border border-outline-variant/10 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center h-full text-on-surface-variant dark:text-slate-400 gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl" translate="no">progress_activity</span>
          <p className="text-sm font-medium">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-sm aspect-[16/9] border border-outline-variant/10 dark:border-slate-700">
      <Map
        center={mapCenter}
        level={mapLevel}
        style={{ width: '100%', height: '100%' }}
        onClick={() => setInfoCenter(null)}
      >
        {validCenters.map((center) => (
          <React.Fragment key={center.id}>
            <MapMarker
              position={{ lat: center.lat, lng: center.lng }}
              onClick={() => {
                setInfoCenter(center);
                setMapCenter({ lat: center.lat, lng: center.lng });
                setMapLevel(4);
                onMarkerClick?.(center);
              }}
            />
            <CustomOverlayMap position={{ lat: center.lat, lng: center.lng }} yAnchor={2.8}>
              <div
                style={{
                  padding: '4px 10px',
                  background: infoCenter?.id === center.id ? '#0d99ff' : '#0061a5',
                  color: '#fff',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setInfoCenter(center);
                  setMapCenter({ lat: center.lat, lng: center.lng });
                  setMapLevel(4);
                }}
              >
                {center.markerLabel}
              </div>
            </CustomOverlayMap>
          </React.Fragment>
        ))}

        {infoCenter && (
          <CustomOverlayMap position={{ lat: infoCenter.lat, lng: infoCenter.lng }} yAnchor={1.15}>
            <div
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                minWidth: '220px',
                maxWidth: '280px',
                position: 'relative',
                transform: 'translateY(-40px)',
              }}
            >
              <button
                onClick={() => setInfoCenter(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#888',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: '14px',
                  marginBottom: '6px',
                  color: '#1b1c1c',
                  paddingRight: '20px',
                }}
              >
                {infoCenter.name}
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                {infoCenter.address}
              </p>
              {infoCenter.phone && (
                <p style={{ fontSize: '12px', color: '#0061a5', fontWeight: 600 }}>
                  {infoCenter.phone}
                </p>
              )}
            </div>
          </CustomOverlayMap>
        )}
      </Map>
      {validCenters.length === 0 && emptyMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-xs font-medium text-on-surface-variant dark:text-slate-300 shadow-md border border-outline-variant/20 dark:border-slate-700 pointer-events-none">
          {emptyMessage}
        </div>
      )}
    </div>
  );
};
