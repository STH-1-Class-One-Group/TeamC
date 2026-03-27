import React, { useMemo, useState } from 'react';

type ReserveStatus = 'Active' | 'Reserved' | 'Closed' | 'Available';

interface ReserveCenter {
  id: string;
  name: string;
  status: ReserveStatus;
  distance: string;
  address: string;
  summary: string;
  position: {
    top: string;
    left: string;
  };
}

const MAP_IMAGE_URL =
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80';

const reserveCenters: ReserveCenter[] = [
  {
    id: 'seocho',
    name: '서초 예비군 훈련장',
    status: 'Active',
    distance: '1.2km',
    address: '서울 서초구 서초중앙로 45-1',
    summary: '도심 접근성이 좋아 빠르게 방문할 수 있는 기본 훈련 거점입니다.',
    position: { top: '26%', left: '34%' },
  },
  {
    id: 'gangnam',
    name: '강남 예비군 훈련장',
    status: 'Reserved',
    distance: '3.5km',
    address: '서울 강남구 학동로 112-3',
    summary: '예약률이 높은 훈련장으로 일정 관리와 사전 확인이 중요합니다.',
    position: { top: '48%', left: '64%' },
  },
  {
    id: 'songpa',
    name: '송파 학생예비군 교육관',
    status: 'Closed',
    distance: '5.8km',
    address: '서울 송파구 올림픽로 102-4',
    summary: '현재 정비 중인 교육관으로 이용 가능 시점 확인이 필요합니다.',
    position: { top: '38%', left: '76%' },
  },
  {
    id: 'mapo',
    name: '마포 동원훈련장',
    status: 'Available',
    distance: '7.1km',
    address: '서울 마포구 월드컵북로 271',
    summary: '주말 신청 수요가 많은 대형 동원훈련장입니다.',
    position: { top: '30%', left: '18%' },
  },
  {
    id: 'guro',
    name: '구로 지역대 예비군 훈련소',
    status: 'Available',
    distance: '8.4km',
    address: '서울 구로구 디지털로 198',
    summary: '행정 지원이 빠른 편이라 초동 문의에 적합한 지역대입니다.',
    position: { top: '60%', left: '24%' },
  },
];

const statusStyles: Record<
  ReserveStatus,
  {
    badge: string;
    marker: string;
    button: string;
  }
> = {
  Active: {
    badge: 'bg-primary/10 text-primary dark:bg-blue-500/15 dark:text-blue-300',
    marker: 'text-primary',
    button: 'bg-primary text-on-primary hover:opacity-90',
  },
  Reserved: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    marker: 'text-amber-500',
    button: 'bg-amber-500 text-white hover:opacity-90',
  },
  Closed: {
    badge: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    marker: 'text-slate-500',
    button: 'bg-slate-500 text-white hover:opacity-90',
  },
  Available: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    marker: 'text-emerald-500',
    button: 'bg-emerald-500 text-white hover:opacity-90',
  },
};

export const ArmedReservePage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(reserveCenters[0].id);

  const selectedCenter = useMemo(
    () => reserveCenters.find((center) => center.id === selectedId) ?? reserveCenters[0],
    [selectedId]
  );

  return (
    <div className="w-full">
      <header className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary dark:text-blue-400">
            Armed Reserve
          </p>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface dark:text-white lg:text-6xl">
            예비군 정보 서비스
          </h1>
          <p className="mt-3 max-w-2xl text-base text-on-surface-variant dark:text-slate-400 lg:text-lg">
            지역별 예비군 훈련 거점을 한 화면에서 확인하고, 현재 상태와 접근 정보를 빠르게 살펴볼 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-3 self-start rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-6 py-4 text-lg font-bold text-primary shadow-[0_12px_40px_rgba(27,28,28,0.06)] transition-colors hover:bg-surface-bright dark:border-slate-800 dark:bg-slate-900 dark:text-blue-400"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
            translate="no"
          >
            bookmark
          </span>
          북마크한 훈련장
        </button>
      </header>

      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low shadow-sm">
            <img
              src={MAP_IMAGE_URL}
              alt="서울 예비군 훈련장 지도"
              className="h-full w-full object-cover opacity-90 grayscale-[20%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(252,249,248,0.06),rgba(252,249,248,0.18))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.42))]" />

            {reserveCenters.map((center) => {
              const isSelected = center.id === selectedCenter.id;
              const styles = statusStyles[center.status];

              return (
                <button
                  key={center.id}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                  style={center.position}
                  onClick={() => setSelectedId(center.id)}
                >
                  <div
                    className={`mb-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg transition-transform ${
                      isSelected
                        ? 'scale-100 bg-white text-on-surface dark:bg-slate-950 dark:text-white'
                        : 'scale-95 bg-surface-container-lowest/90 text-on-surface-variant dark:bg-slate-900/90 dark:text-slate-200'
                    }`}
                  >
                    {center.name}
                  </div>
                  <span
                    className={`material-symbols-outlined text-4xl transition-transform ${styles.marker} ${
                      isSelected ? 'scale-110' : 'scale-100 opacity-85'
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    translate="no"
                  >
                    location_on
                  </span>
                </button>
              );
            })}

            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/30 bg-white/85 p-5 shadow-xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/85">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${statusStyles[selectedCenter.status].badge}`}
                    >
                      {selectedCenter.status}
                    </span>
                    <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">
                      {selectedCenter.distance}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-on-surface dark:text-white">
                    {selectedCenter.name}
                  </h2>
                  <p className="mt-2 text-sm text-on-surface-variant dark:text-slate-400">
                    {selectedCenter.address}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm text-on-surface dark:text-slate-200">
                    {selectedCenter.summary}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-dim dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                  >
                    상세보기
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-5 py-3 text-sm font-bold transition-opacity ${statusStyles[selectedCenter.status].button}`}
                  >
                    일정 확인
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute right-6 top-6 flex flex-col gap-2">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-on-surface shadow-lg transition-colors hover:bg-surface-bright dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined" translate="no">
                  add
                </span>
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-on-surface shadow-lg transition-colors hover:bg-surface-bright dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined" translate="no">
                  remove
                </span>
              </button>
            </div>
          </div>
        </div>

        <aside className="col-span-12 space-y-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-on-surface dark:text-white">
              주변 예비군 목록
            </h3>
            <span className="text-sm font-medium text-on-surface-variant dark:text-slate-400">
              총 {reserveCenters.length}개
            </span>
          </div>

          <div className="max-h-[720px] space-y-4 overflow-y-auto pr-2">
            {reserveCenters.map((center) => {
              const isSelected = center.id === selectedCenter.id;
              const styles = statusStyles[center.status];

              return (
                <button
                  key={center.id}
                  type="button"
                  onClick={() => setSelectedId(center.id)}
                  className={`w-full rounded-2xl border p-5 text-left shadow-sm transition-all ${
                    isSelected
                      ? 'border-primary/30 bg-surface-container-lowest shadow-[0_16px_40px_rgba(27,28,28,0.08)] dark:border-blue-400/30 dark:bg-slate-900'
                      : 'border-outline-variant/10 bg-surface-container-lowest hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-on-surface dark:text-white">{center.name}</h4>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${styles.badge}`}>
                          {center.status}
                        </span>
                        <span className="text-xs font-medium text-on-surface-variant dark:text-slate-400">
                          {center.distance}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined transition-colors ${
                        isSelected ? 'text-primary dark:text-blue-400' : 'text-outline dark:text-slate-500'
                      }`}
                      style={{ fontVariationSettings: `'FILL' ${isSelected ? 1 : 0}` }}
                      translate="no"
                    >
                      bookmark
                    </span>
                  </div>

                  <p className="mb-2 text-sm text-on-surface-variant dark:text-slate-400">{center.address}</p>
                  <p className="mb-5 text-sm text-on-surface dark:text-slate-300">{center.summary}</p>

                  <div className="flex gap-2">
                    <span className="flex-1 rounded-full bg-surface-container-high px-4 py-2.5 text-center text-sm font-bold text-on-surface dark:bg-slate-800 dark:text-white">
                      상세보기
                    </span>
                    <span className={`flex-1 rounded-full px-4 py-2.5 text-center text-sm font-bold ${styles.button}`}>
                      일정 확인
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
};
