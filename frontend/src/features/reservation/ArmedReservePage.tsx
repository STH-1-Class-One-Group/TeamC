import React, { useState, useEffect, useCallback } from 'react';
import { KakaoMap } from './components/KakaoMap';
import { TrainingCenterList } from './components/TrainingCenterList';
import { TrainingCenter, RAW_TRAINING_CENTERS } from './data/trainingCenters';

const SIDO_LIST = Array.from(new Set(RAW_TRAINING_CENTERS.map((c) => c.sido))).sort();

const geocodeCenter = (
  geocoder: kakao.maps.services.Geocoder,
  raw: Omit<TrainingCenter, 'lat' | 'lng'>,
): Promise<TrainingCenter | null> =>
  new Promise((resolve) => {
    geocoder.addressSearch(raw.address, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result.length > 0) {
        resolve({ ...raw, lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
      } else {
        resolve(null);
      }
    });
  });

export const ArmedReservePage: React.FC = () => {
  const [selectedSido, setSelectedSido] = useState(SIDO_LIST[0] || '');
  const [centers, setCenters] = useState<TrainingCenter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedCenter, setFocusedCenter] = useState<TrainingCenter | null>(null);
  const [highlightedCenterId, setHighlightedCenterId] = useState<string | null>(null);

  const loadCenters = useCallback(async (sido: string) => {
    const filtered = RAW_TRAINING_CENTERS.filter((c) => c.sido === sido);

    if (typeof kakao === 'undefined' || !kakao.maps?.services) {
      setCenters(filtered.map((c) => ({ ...c, lat: 0, lng: 0 })));
      return;
    }

    setIsLoading(true);
    const geocoder = new kakao.maps.services.Geocoder();
    const results: TrainingCenter[] = [];

    for (const raw of filtered) {
      const resolved = await geocodeCenter(geocoder, raw);
      if (resolved) results.push(resolved);
    }

    setCenters(results);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedSido) return;

    const tryLoad = () => {
      if (typeof kakao !== 'undefined' && kakao.maps?.services) {
        loadCenters(selectedSido);
      } else {
        const timer = window.setTimeout(tryLoad, 300);
        return () => window.clearTimeout(timer);
      }
    };
    tryLoad();
  }, [selectedSido, loadCenters]);

  return (
    <div className="space-y-12 w-full">
      <section>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-[3.5rem] font-extrabold tracking-tighter leading-tight text-on-surface dark:text-white">
              예비군 정보 서비스
            </h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2 text-lg">
              내 주변 훈련소 정보와 예약을 한눈에 관리하세요.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sido-select" className="text-sm font-medium text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
              지역 선택
            </label>
            <select
              id="sido-select"
              value={selectedSido}
              onChange={(e) => setSelectedSido(e.target.value)}
              className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              {SIDO_LIST.map((sido) => (
                <option key={sido} value={sido}>{sido}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <KakaoMap centers={centers} focusedCenter={focusedCenter} onMarkerClick={(c) => setHighlightedCenterId(c.id)} />
        </div>
        <div className="lg:col-span-4">
          <TrainingCenterList centers={centers} isLoading={isLoading} onDetailClick={setFocusedCenter} highlightedCenterId={highlightedCenterId} />
        </div>
      </div>
    </div>
  );
};
