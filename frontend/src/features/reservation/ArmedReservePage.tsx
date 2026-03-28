import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { KakaoMap } from './components/KakaoMap';
import { TrainingCenterList } from './components/TrainingCenterList';
import { TrainingCenterModal } from './components/TrainingCenterModal';
import { TRAINING_CENTERS, TrainingCenter } from './data/trainingCenters';

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SIDO_LIST = Array.from(new Set(TRAINING_CENTERS.map((center) => center.sido))).sort();
const SIDO_LABELS: Record<string, string> = {
  '강원특별자치도': '강원',
  '경기도': '경기',
  '경상남도': '경남',
  '경상북도': '경북',
  '광주광역시': '광주',
  '대구광역시': '대구',
  '대전광역시': '대전',
  '부산광역시': '부산',
  '서울특별시': '서울',
  '세종특별자치시': '세종',
  '울산광역시': '울산',
  '인천광역시': '인천',
  '전라남도': '전남',
  '전북특별자치도': '전북',
  '제주특별자치도': '제주',
  '충청남도': '충남',
  '충청북도': '충북',
};

const getZonesForSido = (sido: string) =>
  Array.from(
    new Set(
      TRAINING_CENTERS
        .filter((center) => center.sido === sido)
        .flatMap((center) => center.zones)
    )
  ).sort();

const matchesTrainingCenterSearch = (center: TrainingCenter, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const aliases = center.aliases.join(' ').toLowerCase();
  const zones = center.zones.join(' ').toLowerCase();
  return (
    center.name.toLowerCase().includes(normalizedQuery) ||
    aliases.includes(normalizedQuery) ||
    center.address.toLowerCase().includes(normalizedQuery) ||
    zones.includes(normalizedQuery)
  );
};

export const ArmedReservePage: React.FC = () => {
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCenter, setFocusedCenter] = useState<TrainingCenter | null>(null);
  const [highlightedCenterId, setHighlightedCenterId] = useState<string | null>(null);
  const [modalCenter, setModalCenter] = useState<TrainingCenter | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const zones = useMemo(() => (selectedSido ? getZonesForSido(selectedSido) : []), [selectedSido]);

  useEffect(() => {
    if (selectedZone && !zones.includes(selectedZone)) {
      setSelectedZone('');
    }
  }, [selectedZone, zones]);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  const filteredCenters = useMemo(() => {
    if (!selectedSido) {
      return [];
    }

    const bySido = TRAINING_CENTERS.filter((center) => center.sido === selectedSido);

    if (!selectedZone) {
      return bySido;
    }

    return bySido.filter((center) => center.zones.includes(selectedZone));
  }, [selectedSido, selectedZone]);

  const visibleCenters = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredCenters;
    }

    return TRAINING_CENTERS.filter((center) => matchesTrainingCenterSearch(center, searchQuery));
  }, [filteredCenters, searchQuery]);

  const sortedCenters = useMemo(() => {
    if (!userLocation) {
      return visibleCenters;
    }

    return visibleCenters
      .map((center) => ({
        ...center,
        distance: haversineKm(userLocation.lat, userLocation.lng, center.lat, center.lng),
      }))
      .sort((left, right) => (left.distance ?? Infinity) - (right.distance ?? Infinity));
  }, [visibleCenters, userLocation]);

  const emptyStateMessage = searchQuery.trim()
    ? '검색 결과가 없습니다.'
    : !selectedSido
      ? '시/도를 먼저 선택해주세요.'
      : '해당 지역에 훈련장이 없습니다.';

  return (
    <div className="space-y-12 w-full">
      <Helmet>
        <title>예비군 훈련장 찾기 — Modern Sentinel</title>
        <meta name="description" content="전국 289개 예비군 훈련장 위치, 연락처, 지도 보기. 내 주변 훈련장을 거리순으로 찾아보세요." />
        <meta property="og:title" content="예비군 훈련장 찾기 — Modern Sentinel" />
        <meta property="og:description" content="전국 예비군 훈련장 위치와 정보를 한눈에. 카카오맵으로 내 주변 훈련장을 확인하세요." />
      </Helmet>
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
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <button
              onClick={requestUserLocation}
              disabled={locationLoading}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                userLocation
                  ? 'bg-primary/10 dark:bg-blue-900/30 text-primary dark:text-blue-400 border border-primary/30 dark:border-blue-500/30'
                  : 'bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-slate-200 border border-outline-variant/30 dark:border-slate-700 hover:bg-surface-dim dark:hover:bg-slate-700'
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg ${locationLoading ? 'animate-spin' : ''}`}
                translate="no"
              >
                {locationLoading ? 'progress_activity' : 'my_location'}
              </span>
              {userLocation ? '내 위치 기준' : '내 위치'}
            </button>
            <label
              htmlFor="sido-select"
              className="text-sm font-medium text-on-surface-variant dark:text-slate-400 whitespace-nowrap"
            >
              지역 선택
            </label>
            <select
              id="sido-select"
              value={selectedSido}
              onChange={(event) => setSelectedSido(event.target.value)}
              className="w-28 md:w-32 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              <option value="">시/도 선택</option>
              {SIDO_LIST.map((sido) => (
                <option key={sido} value={sido}>
                  {SIDO_LABELS[sido] ?? sido}
                </option>
              ))}
            </select>
            <select
              id="zone-select"
              value={selectedZone}
              onChange={(event) => setSelectedZone(event.target.value)}
              disabled={!selectedSido}
              className="w-36 md:w-44 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{selectedSido ? '전체 구/군' : '구/군 선택'}</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <KakaoMap
            centers={sortedCenters}
            focusedCenter={focusedCenter}
            onMarkerClick={(center) => setHighlightedCenterId(center.id)}
            emptyMessage={searchQuery.trim()
              ? '검색 결과로 표시할 훈련장이 없습니다.'
              : !selectedSido
                ? '시/도를 선택하면 훈련장 위치를 지도에서 볼 수 있습니다.'
                : '선택한 지역에 표시할 훈련장이 없습니다.'}
          />
        </div>
        <div className="lg:col-span-4">
          <TrainingCenterList
            centers={sortedCenters}
            isLoading={false}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            emptyStateMessage={emptyStateMessage}
            onPreviewClick={(center) => {
              setFocusedCenter(center);
              setHighlightedCenterId(center.id);
            }}
            onDetailClick={(center) => {
              setModalCenter(center);
            }}
            highlightedCenterId={highlightedCenterId}
          />
        </div>
      </div>

      {modalCenter && (
        <TrainingCenterModal
          center={modalCenter}
          onClose={() => setModalCenter(null)}
        />
      )}
    </div>
  );
};
