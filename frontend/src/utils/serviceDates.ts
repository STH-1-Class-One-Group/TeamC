const ACTIVE_DUTY_MONTHS = 18;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface ServiceTimeline {
  hasEnlistmentDate: boolean;
  enlistmentLabel: string;
  dischargeLabel: string;
  dDayLabel: string;
  progressPercent: number;
  helperText: string;
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

export const calculateServiceTimeline = (
  enlistmentDate: string | null | undefined,
  now = new Date()
): ServiceTimeline => {
  if (!enlistmentDate) {
    return {
      hasEnlistmentDate: false,
      enlistmentLabel: '-',
      dischargeLabel: '-',
      dDayLabel: '입대일 필요',
      progressPercent: 0,
      helperText: '회원가입 시 입력한 입대일이 없으면 군 복무일 계산을 표시할 수 없습니다.',
    };
  }

  const enlistment = parseIsoDate(enlistmentDate);
  if (Number.isNaN(enlistment.getTime())) {
    return {
      hasEnlistmentDate: false,
      enlistmentLabel: '-',
      dischargeLabel: '-',
      dDayLabel: '날짜 오류',
      progressPercent: 0,
      helperText: '저장된 입대일 형식이 올바르지 않습니다.',
    };
  }

  const discharge = new Date(
    enlistment.getFullYear(),
    enlistment.getMonth() + ACTIVE_DUTY_MONTHS,
    enlistment.getDate()
  );
  discharge.setDate(discharge.getDate() - 1);

  const today = toDateOnly(now);
  const totalDays = diffInDays(discharge, enlistment) + 1;
  const servedDays =
    today < enlistment ? 0 : Math.min(totalDays, diffInDays(today, enlistment) + 1);
  const remainingDays = today > discharge ? 0 : diffInDays(discharge, today);
  const progressPercent = totalDays > 0 ? (servedDays / totalDays) * 100 : 0;

  return {
    hasEnlistmentDate: true,
    enlistmentLabel: formatDisplayDate(enlistment),
    dischargeLabel: formatDisplayDate(discharge),
    dDayLabel: today > discharge ? '전역 완료' : `D-${remainingDays}`,
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
    helperText: '병 기준 18개월 복무 기준으로 자동 계산됩니다.',
  };
};
