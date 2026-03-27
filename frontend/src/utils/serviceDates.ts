const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const USER_TYPE_OPTIONS = [
  { value: 'civilian', label: '일반인' },
  { value: 'active_enlisted', label: '현역군인(병)' },
  { value: 'active_cadre', label: '현역간부' },
] as const;

export const CADET_CATEGORY_OPTIONS = [
  { value: 'officer', label: '장교' },
  { value: 'nco', label: '부사관' },
  { value: 'civilian_staff', label: '군무원' },
] as const;

export const SERVICE_TRACK_CONFIG = {
  army_active: {
    label: '육군',
    durationMonths: 18,
  },
  air_force_active: {
    label: '공군',
    durationMonths: 21,
  },
  social_service: {
    label: '공익근무요원(사회복무요원)',
    durationMonths: 21,
  },
  industrial_service_active: {
    label: '산업체요원(산업기능요원·현역입영대상자)',
    durationMonths: 34,
  },
  industrial_service_supplementary: {
    label: '산업체요원(산업기능요원·사회복무요원소집대상자)',
    durationMonths: 23,
  },
} as const;

export const OFFICER_RANK_OPTIONS = [
  '소위',
  '중위',
  '대위',
  '소령',
  '중령',
  '대령',
  '준장',
  '소장',
  '중장',
  '대장',
] as const;

export const NCO_RANK_OPTIONS = [
  '하사',
  '중사',
  '상사',
  '원사',
  '준위',
] as const;

export const CIVILIAN_STAFF_RANK_OPTIONS = [
  '주사보',
  '주사',
  '주무관',
  '사무관',
  '서기관',
  '부이사관',
] as const;

const ENLISTED_AUTO_RANK_TRACKS = ['army_active', 'air_force_active'] as const;
const ACQUAINTANCE_ALLOWED_TRACKS = ['army_active', 'air_force_active'] as const;
const ENLISTED_RANK_STEPS = [
  { rank: '병장', thresholdMonths: 14 },
  { rank: '상병', thresholdMonths: 8 },
  { rank: '일병', thresholdMonths: 2 },
] as const;

export type UserType = (typeof USER_TYPE_OPTIONS)[number]['value'];
export type CadreCategory = (typeof CADET_CATEGORY_OPTIONS)[number]['value'];
export type ServiceTrack = keyof typeof SERVICE_TRACK_CONFIG;
export type EnlistedAutoRankTrack = (typeof ENLISTED_AUTO_RANK_TRACKS)[number];

export const SERVICE_TRACK_OPTIONS = Object.entries(SERVICE_TRACK_CONFIG).map(([value, config]) => ({
  value: value as ServiceTrack,
  label: config.label,
  durationLabel: `${config.durationMonths}개월`,
}));

export const ACQUAINTANCE_SERVICE_TRACK_OPTIONS = SERVICE_TRACK_OPTIONS.filter((option) =>
  ACQUAINTANCE_ALLOWED_TRACKS.includes(option.value as (typeof ACQUAINTANCE_ALLOWED_TRACKS)[number])
);

export interface ServiceTimelineInput {
  userType?: string | null;
  serviceTrack?: string | null;
  enlistmentDate?: string | null;
  cadreCategory?: string | null;
  rank?: string | null;
  acquaintanceName?: string | null;
  acquaintanceServiceTrack?: string | null;
  acquaintanceEnlistmentDate?: string | null;
  now?: Date;
}

export interface ServiceTimeline {
  hasEnlistmentDate: boolean;
  hasServiceTrack: boolean;
  enlistmentLabel: string;
  dischargeLabel: string;
  dDayLabel: string;
  progressPercent: number;
  helperText: string;
  serviceLabel: string;
  serviceDurationLabel: string;
  displayRankLabel: string;
  subjectLabel: string;
  usesAcquaintance: boolean;
}

export interface ProfileDisplayLike {
  user_type?: string | null;
  service_track?: string | null;
  enlistment_date?: string | null;
  cadre_category?: string | null;
  rank?: string | null;
}

const toDateOnly = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}. ${month}. ${day}`;
};

const diffInDays = (later: Date, earlier: Date) =>
  Math.floor((toDateOnly(later).getTime() - toDateOnly(earlier).getTime()) / ONE_DAY_MS);

const diffInMonths = (later: Date, earlier: Date) => {
  let months =
    (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());

  if (later.getDate() < earlier.getDate()) {
    months -= 1;
  }

  return months;
};

const isTrackInConfig = (serviceTrack?: string | null): serviceTrack is ServiceTrack =>
  Boolean(serviceTrack && serviceTrack in SERVICE_TRACK_CONFIG);

export const isEnlistedUser = (userType: string | null | undefined) => userType === 'active_enlisted';

export const isCadreUser = (userType: string | null | undefined) => userType === 'active_cadre';

export const getUserTypeLabel = (userType: string | null | undefined) =>
  USER_TYPE_OPTIONS.find((option) => option.value === userType)?.label ?? '미설정';

export const getCadreCategoryLabel = (cadreCategory: string | null | undefined) =>
  CADET_CATEGORY_OPTIONS.find((option) => option.value === cadreCategory)?.label ?? '-';

export const getCadreRankFieldLabel = (cadreCategory: string | null | undefined) =>
  cadreCategory === 'civilian_staff' ? '직급' : '계급';

export const getCadreRankOptions = (cadreCategory: string | null | undefined) => {
  switch (cadreCategory) {
    case 'officer':
      return [...OFFICER_RANK_OPTIONS];
    case 'nco':
      return [...NCO_RANK_OPTIONS];
    case 'civilian_staff':
      return [...CIVILIAN_STAFF_RANK_OPTIONS];
    default:
      return [];
  }
};

export const canAutoDisplayEnlistedRank = (serviceTrack: string | null | undefined): serviceTrack is EnlistedAutoRankTrack =>
  ENLISTED_AUTO_RANK_TRACKS.includes(serviceTrack as EnlistedAutoRankTrack);

export const getAutoEnlistedRank = (
  serviceTrack: string | null | undefined,
  enlistmentDate: string | null | undefined,
  now = new Date()
) => {
  if (!canAutoDisplayEnlistedRank(serviceTrack) || !enlistmentDate) {
    return null;
  }

  const enlistment = parseIsoDate(enlistmentDate);
  if (Number.isNaN(enlistment.getTime())) {
    return null;
  }

  const today = toDateOnly(now);
  if (today < enlistment) {
    return '이병';
  }

  const servedMonths = diffInMonths(today, enlistment);
  for (const step of ENLISTED_RANK_STEPS) {
    if (servedMonths >= step.thresholdMonths) {
      return step.rank;
    }
  }

  return '이병';
};

export const getDisplayRank = (
  input: Pick<ServiceTimelineInput, 'userType' | 'serviceTrack' | 'enlistmentDate' | 'rank'>,
  now = new Date()
) => {
  if (input.userType === 'active_enlisted') {
    return getAutoEnlistedRank(input.serviceTrack, input.enlistmentDate, now);
  }

  if (input.userType === 'active_cadre') {
    return input.rank?.trim() || null;
  }

  return null;
};

export const getProfileDisplayRank = (profile?: ProfileDisplayLike | null, now = new Date()) =>
  getDisplayRank(
    {
      userType: profile?.user_type,
      serviceTrack: profile?.service_track,
      enlistmentDate: profile?.enlistment_date,
      rank: profile?.rank,
    },
    now
  );

const calculateTrackedServiceTimeline = (
  serviceTrack: string,
  enlistmentDate: string,
  subjectLabel: string,
  helperPrefix: string,
  displayRankLabel: string,
  now = new Date()
): ServiceTimeline => {
  if (!isTrackInConfig(serviceTrack)) {
    return {
      hasEnlistmentDate: Boolean(enlistmentDate),
      hasServiceTrack: false,
      enlistmentLabel: enlistmentDate ? formatDisplayDate(parseIsoDate(enlistmentDate)) : '-',
      dischargeLabel: '-',
      dDayLabel: '복무유형 필요',
      progressPercent: 0,
      helperText: `${helperPrefix} 복무 유형을 설정해야 진행률을 표시할 수 있습니다.`,
      serviceLabel: '-',
      serviceDurationLabel: '-',
      displayRankLabel,
      subjectLabel,
      usesAcquaintance: helperPrefix.includes('지인'),
    };
  }

  const selectedService = SERVICE_TRACK_CONFIG[serviceTrack];
  if (!enlistmentDate) {
    return {
      hasEnlistmentDate: false,
      hasServiceTrack: true,
      enlistmentLabel: '-',
      dischargeLabel: '-',
      dDayLabel: '입대일 필요',
      progressPercent: 0,
      helperText: `${helperPrefix} 입대일을 설정해야 진행률을 표시할 수 있습니다.`,
      serviceLabel: selectedService.label,
      serviceDurationLabel: `${selectedService.durationMonths}개월`,
      displayRankLabel,
      subjectLabel,
      usesAcquaintance: helperPrefix.includes('지인'),
    };
  }

  const enlistment = parseIsoDate(enlistmentDate);
  if (Number.isNaN(enlistment.getTime())) {
    return {
      hasEnlistmentDate: false,
      hasServiceTrack: true,
      enlistmentLabel: '-',
      dischargeLabel: '-',
      dDayLabel: '날짜 오류',
      progressPercent: 0,
      helperText: '저장된 입대일 형식이 올바르지 않습니다.',
      serviceLabel: selectedService.label,
      serviceDurationLabel: `${selectedService.durationMonths}개월`,
      displayRankLabel,
      subjectLabel,
      usesAcquaintance: helperPrefix.includes('지인'),
    };
  }

  const discharge = new Date(
    enlistment.getFullYear(),
    enlistment.getMonth() + selectedService.durationMonths,
    enlistment.getDate()
  );
  discharge.setDate(discharge.getDate() - 1);

  const today = toDateOnly(now);
  const totalDays = diffInDays(discharge, enlistment) + 1;
  const servedDays = today < enlistment ? 0 : Math.min(totalDays, diffInDays(today, enlistment) + 1);
  const remainingDays = today > discharge ? 0 : diffInDays(discharge, today);
  const progressPercent = totalDays > 0 ? (servedDays / totalDays) * 100 : 0;
  const autoRankSupported = canAutoDisplayEnlistedRank(serviceTrack);
  const rankHelperText = autoRankSupported
    ? `${displayRankLabel} 기준 이미지가 자동 반영됩니다.`
    : '이 복무 유형은 군 계급 자동 계산을 지원하지 않습니다.';

  return {
    hasEnlistmentDate: true,
    hasServiceTrack: true,
    enlistmentLabel: formatDisplayDate(enlistment),
    dischargeLabel: formatDisplayDate(discharge),
    dDayLabel: today > discharge ? '전역 완료' : `D-${remainingDays}`,
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
    helperText: `${selectedService.label} 기준 ${selectedService.durationMonths}개월 복무기간으로 자동 계산됩니다. ${rankHelperText}`,
    serviceLabel: selectedService.label,
    serviceDurationLabel: `${selectedService.durationMonths}개월`,
    displayRankLabel,
    subjectLabel,
    usesAcquaintance: helperPrefix.includes('지인'),
  };
};

export const calculateServiceTimeline = ({
  userType,
  serviceTrack,
  enlistmentDate,
  cadreCategory,
  rank,
  acquaintanceName,
  acquaintanceServiceTrack,
  acquaintanceEnlistmentDate,
  now = new Date(),
}: ServiceTimelineInput): ServiceTimeline => {
  if (!userType) {
    return {
      hasEnlistmentDate: false,
      hasServiceTrack: false,
      enlistmentLabel: '-',
      dischargeLabel: '-',
      dDayLabel: '회원유형 필요',
      progressPercent: 0,
      helperText: '회원가입 또는 마이페이지에서 회원 유형을 먼저 선택해주세요.',
      serviceLabel: '-',
      serviceDurationLabel: '-',
      displayRankLabel: '-',
      subjectLabel: '복무 현황',
      usesAcquaintance: false,
    };
  }

  if (userType === 'civilian') {
    const trimmedName = acquaintanceName?.trim() || '';
    const hasAnyAcquaintance =
      Boolean(trimmedName) ||
      Boolean(acquaintanceServiceTrack?.trim()) ||
      Boolean(acquaintanceEnlistmentDate?.trim());

    if (!hasAnyAcquaintance) {
      return {
        hasEnlistmentDate: false,
        hasServiceTrack: false,
        enlistmentLabel: '-',
        dischargeLabel: '-',
        dDayLabel: '지인 정보 없음',
        progressPercent: 0,
        helperText: '일반인 회원은 지인 1명의 복무 정보를 입력하면 해당 지인 기준 진행률을 확인할 수 있습니다.',
        serviceLabel: '지인 미설정',
        serviceDurationLabel: '-',
        displayRankLabel: '-',
        subjectLabel: '지인 복무 현황',
        usesAcquaintance: false,
      };
    }

    const subjectLabel = trimmedName ? `${trimmedName} 복무 현황` : '지인 복무 현황';
    const displayRankLabel =
      getAutoEnlistedRank(acquaintanceServiceTrack, acquaintanceEnlistmentDate, now) ?? '-';

    return calculateTrackedServiceTimeline(
      acquaintanceServiceTrack ?? '',
      acquaintanceEnlistmentDate ?? '',
      subjectLabel,
      '지인 1명의',
      displayRankLabel,
      now
    );
  }

  if (userType === 'active_cadre') {
    const displayRankLabel = rank?.trim() || '-';
    return {
      hasEnlistmentDate: Boolean(enlistmentDate),
      hasServiceTrack: false,
      enlistmentLabel: enlistmentDate ? formatDisplayDate(parseIsoDate(enlistmentDate)) : '-',
      dischargeLabel: '별도 관리',
      dDayLabel: '수동 관리',
      progressPercent: 0,
      helperText: `${getCadreCategoryLabel(cadreCategory)} 계정은 고정 복무기간 기반의 자동 전역일 계산을 지원하지 않습니다.`,
      serviceLabel: getCadreCategoryLabel(cadreCategory),
      serviceDurationLabel: '-',
      displayRankLabel,
      subjectLabel: '복무 현황',
      usesAcquaintance: false,
    };
  }

  const displayRankLabel = getAutoEnlistedRank(serviceTrack, enlistmentDate, now) ?? '-';
  return calculateTrackedServiceTimeline(
    serviceTrack ?? '',
    enlistmentDate ?? '',
    '복무 현황',
    '현역군인(병) 회원은',
    displayRankLabel,
    now
  );
};
