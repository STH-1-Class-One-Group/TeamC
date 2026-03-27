import React, { useEffect, useState } from 'react';
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { TrainingCenter } from '../data/trainingCenters';

interface KakaoMapProps {
  centers: TrainingCenter[];
  focusedCenter?: TrainingCenter | null;
  onMarkerClick?: (center: TrainingCenter) => void;
}

const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY || '';

export const KakaoMap: React.FC<KakaoMapProps> = ({ centers, focusedCenter, onMarkerClick }) => {
  const [loading, error] = useKakaoLoader({
    appkey: KAKAO_MAP_KEY,
    libraries: ['services'],
  });

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 36.5, lng: 127.5 });
  const [mapLevel, setMapLevel] = useState(12);
  const [infoCenter, setInfoCenter] = useState<TrainingCenter | null>(null);

  const validCenters = centers.filter((c) => c.lat !== 0 && c.lng !== 0);

  // Fit bounds when centers change
  useEffect(() => {
    if (validCenters.length === 0) return;

    if (validCenters.length === 1) {
      setMapCenter({ lat: validCenters[0].lat, lng: validCenters[0].lng });
      setMapLevel(5);
      return;
    }

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const c of validCenters) {
      if (c.lat < minLat) minLat = c.lat;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lng < minLng) minLng = c.lng;
      if (c.lng > maxLng) maxLng = c.lng;
    }
    setMapCenter({ lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 });

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    if (maxDiff < 0.02) setMapLevel(5);
    else if (maxDiff < 0.05) setMapLevel(6);
    else if (maxDiff < 0.1) setMapLevel(7);
    else if (maxDiff < 0.3) setMapLevel(8);
    else if (maxDiff < 0.5) setMapLevel(9);
    else if (maxDiff < 1) setMapLevel(10);
    else setMapLevel(11);

    setInfoCenter(null);
  }, [validCenters]);

  // Focus on a specific center when "상세보기" is clicked
  useEffect(() => {
    if (!focusedCenter || focusedCenter.lat === 0) return;
    setMapCenter({ lat: focusedCenter.lat, lng: focusedCenter.lng });
    setMapLevel(3);
    setInfoCenter(focusedCenter);
  }, [focusedCenter]);

  if (!KAKAO_MAP_KEY || error) {
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
        {validCenters.map((tc) => (
          <React.Fragment key={tc.id}>
            <MapMarker
              position={{ lat: tc.lat, lng: tc.lng }}
              onClick={() => {
                setInfoCenter(tc);
                setMapCenter({ lat: tc.lat, lng: tc.lng });
                setMapLevel(4);
                onMarkerClick?.(tc);
              }}
            />
            <CustomOverlayMap position={{ lat: tc.lat, lng: tc.lng }} yAnchor={2.8}>
              <div
                style={{
                  padding: '4px 10px',
                  background: infoCenter?.id === tc.id ? '#0d99ff' : '#0061a5',
                  color: '#fff',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setInfoCenter(tc);
                  setMapCenter({ lat: tc.lat, lng: tc.lng });
                  setMapLevel(4);
                }}
              >
                {tc.markerLabel}
              </div>
            </CustomOverlayMap>
          </React.Fragment>
        ))}

        {infoCenter && infoCenter.lat !== 0 && (
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
              <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: '#1b1c1c', paddingRight: '20px' }}>
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
    </div>
  );
};
