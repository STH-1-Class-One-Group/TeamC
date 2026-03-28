export type RecruitmentStatus =
  | '모집 예정'
  | '접수 중'
  | '접수 종료'
  | '입영 진행'
  | '입영 종료';

export interface RecruitmentNotice {
  id: string;
  branch: string;
  category: string;
  title: string;
  unit: string;
  roundLabel: string;
  specialty: string;
  appliedCount: number | null;
  selectedCount: number | null;
  pressureGap: string;
  supportRate: string;
  applicationPeriodLabel: string;
  enlistmentPeriodLabel: string;
  entryDateLabel: string;
  status: RecruitmentStatus;
  tags: string[];
}

interface RecruitmentApiItem {
  gunGbnm: string;
  mojipGbnm: string;
  mojipYy: string;
  mojipTms: string;
  gsteukgiCd: string;
  gsteukgiNm: string;
  iybudaeCdm: string;
  seonbalPcnt: string;
  jeopsuPcnt: string;
  extremes: string;
  rate: string;
  jeopsuSjdtm: string;
  jeopsuJrdtm: string;
  iyyjsijakYm: string;
  iyyjjongryoYm: string;
  ipyeongDe: string;
}

const API_ENDPOINT = 'https://apis.data.go.kr/1300000/MJBGJWJeopSuHH4/list';
const REQUEST_STEPS = [5, 10, 15, 20, 25, 30];
const DATE_OFFSET_YEARS = 3;

const rawDataServiceKey =
  process.env.REACT_APP_DATA_SERVICE_KEY ||
  process.env.REACT_DATA_SERVICE_KEY ||
  '';

export const hasRecruitmentServiceKey = Boolean(rawDataServiceKey);

const readText = (parent: Element, tagName: keyof RecruitmentApiItem) =>
  parent.querySelector(tagName)?.textContent?.trim() ?? '';

const parseNumber = (value: string) => {
  const normalized = value.replace(/[^\d.-]/g, '');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const addYearsToDateText = (value: string) => {
  if (!/^\d{8}$/.test(value)) {
    return '';
  }

  const year = Number(value.slice(0, 4)) + DATE_OFFSET_YEARS;
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);

  return `${year}${month}${day}`;
};

const addYearsToYearMonthText = (value: string) => {
  if (!/^\d{6}$/.test(value)) {
    return '';
  }

  const year = Number(value.slice(0, 4)) + DATE_OFFSET_YEARS;
  const month = value.slice(4, 6);

  return `${year}${month}`;
};

const formatDate = (value: string) => {
  if (!/^\d{8}$/.test(value)) {
    return value || '-';
  }

  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
};

const formatYearMonth = (value: string) => {
  if (!/^\d{6}$/.test(value)) {
    return value || '-';
  }

  return `${value.slice(0, 4)}.${value.slice(4, 6)}`;
};

const parseDate = (value: string) => {
  if (!/^\d{8}$/.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));

  return new Date(year, month, day, 0, 0, 0, 0);
};

const parseYearMonthStart = (value: string) => {
  if (!/^\d{6}$/.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;

  return new Date(year, month, 1, 0, 0, 0, 0);
};

const parseYearMonthEnd = (value: string) => {
  if (!/^\d{6}$/.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));

  return new Date(year, month, 0, 23, 59, 59, 999);
};

const getStatus = (item: RecruitmentApiItem): RecruitmentStatus => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const receiptStart = parseDate(addYearsToDateText(item.jeopsuSjdtm));
  const receiptEnd = parseDate(addYearsToDateText(item.jeopsuJrdtm));
  const enlistmentStartFromMonth = parseYearMonthStart(addYearsToYearMonthText(item.iyyjsijakYm));
  const enlistmentEnd = parseYearMonthEnd(addYearsToYearMonthText(item.iyyjjongryoYm));
  const exactEntryDate = (() => {
    if (/^\d{8}$/.test(item.ipyeongDe)) {
      return parseDate(addYearsToDateText(item.ipyeongDe));
    }

    if (/^\d{6}$/.test(item.ipyeongDe)) {
      return parseYearMonthStart(addYearsToYearMonthText(item.ipyeongDe));
    }

    return null;
  })();
  const enlistmentStart = exactEntryDate ?? enlistmentStartFromMonth;

  if (enlistmentEnd && today > enlistmentEnd) {
    return '입영 종료';
  }

  if (enlistmentStart && today >= enlistmentStart) {
    return '입영 진행';
  }

  if (receiptEnd && today > receiptEnd) {
    return '접수 종료';
  }

  if (receiptStart && receiptEnd && today >= receiptStart && today <= receiptEnd) {
    return '접수 중';
  }

  return '모집 예정';
};

const getEntryDateLabel = (value: string) => {
  if (/^\d{8}$/.test(value)) {
    return formatDate(addYearsToDateText(value));
  }

  if (/^\d{6}$/.test(value)) {
    return formatYearMonth(addYearsToYearMonthText(value));
  }

  return value && value !== '*' ? value : '미정';
};

const makePeriodLabel = (start: string, end: string, formatter: (value: string) => string) => {
  const formattedStart = formatter(start);
  const formattedEnd = formatter(end);

  if (formattedStart === '-' && formattedEnd === '-') {
    return '미정';
  }

  return `${formattedStart} - ${formattedEnd}`;
};

const normalizeItem = (item: RecruitmentApiItem): RecruitmentNotice => {
  const branch = item.gunGbnm || '미분류';
  const category = item.mojipGbnm || '미분류';
  const specialty = item.gsteukgiNm || '특기 미정';
  const unit = item.iybudaeCdm || '입영 부대 미정';
  const roundLabel = `${item.mojipYy || '-'}년 ${item.mojipTms || '-'}회차`;
  const selectedCount = parseNumber(item.seonbalPcnt);
  const appliedCount = parseNumber(item.jeopsuPcnt);
  const supportRate = item.rate ? `${item.rate}:1` : '집계 중';
  const pressureGap = item.extremes || '집계 중';

  return {
    id: [
      item.mojipYy,
      item.mojipTms,
      item.gsteukgiCd,
      item.gunGbnm,
      item.iybudaeCdm,
    ]
      .filter(Boolean)
      .join('-'),
    branch,
    category,
    title: `${branch} ${specialty}`,
    unit,
    roundLabel,
    specialty,
    appliedCount,
    selectedCount,
    pressureGap,
    supportRate,
    applicationPeriodLabel: makePeriodLabel(
      addYearsToDateText(item.jeopsuSjdtm),
      addYearsToDateText(item.jeopsuJrdtm),
      formatDate
    ),
    enlistmentPeriodLabel: makePeriodLabel(
      addYearsToYearMonthText(item.iyyjsijakYm),
      addYearsToYearMonthText(item.iyyjjongryoYm),
      formatYearMonth
    ),
    entryDateLabel: getEntryDateLabel(item.ipyeongDe),
    status: getStatus(item),
    tags: [
      branch,
      category,
      specialty,
      unit,
      `${branch} ${category}`,
      `${branch} ${specialty}`,
      `${unit} ${specialty}`,
    ].filter(Boolean),
  };
};

const parseRecruitmentXml = (xmlText: string) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');

  if (xml.querySelector('parsererror')) {
    throw new Error('모병 모집 API 응답을 해석하지 못했습니다.');
  }

  const resultCode = xml.querySelector('resultCode')?.textContent?.trim();
  const resultMessage = xml.querySelector('resultMsg')?.textContent?.trim();

  if (resultCode && resultCode !== '00') {
    throw new Error(resultMessage || '모병 모집 API 요청에 실패했습니다.');
  }

  return Array.from(xml.querySelectorAll('item')).map((item) =>
    normalizeItem({
      gunGbnm: readText(item, 'gunGbnm'),
      mojipGbnm: readText(item, 'mojipGbnm'),
      mojipYy: readText(item, 'mojipYy'),
      mojipTms: readText(item, 'mojipTms'),
      gsteukgiCd: readText(item, 'gsteukgiCd'),
      gsteukgiNm: readText(item, 'gsteukgiNm'),
      iybudaeCdm: readText(item, 'iybudaeCdm'),
      seonbalPcnt: readText(item, 'seonbalPcnt'),
      jeopsuPcnt: readText(item, 'jeopsuPcnt'),
      extremes: readText(item, 'extremes'),
      rate: readText(item, 'rate'),
      jeopsuSjdtm: readText(item, 'jeopsuSjdtm'),
      jeopsuJrdtm: readText(item, 'jeopsuJrdtm'),
      iyyjsijakYm: readText(item, 'iyyjsijakYm'),
      iyyjjongryoYm: readText(item, 'iyyjjongryoYm'),
      ipyeongDe: readText(item, 'ipyeongDe'),
    })
  );
};

const dedupeRecruitmentNotices = (items: RecruitmentNotice[]) => {
  const seen = new Set<string>();
  const deduped: RecruitmentNotice[] = [];

  items.forEach((item) => {
    if (!item.id || seen.has(item.id)) {
      return;
    }

    seen.add(item.id);
    deduped.push(item);
  });

  return deduped;
};

export const fetchRecruitmentNotices = async (signal?: AbortSignal) => {
  if (!rawDataServiceKey) {
    throw new Error(
      'REACT_APP_DATA_SERVICE_KEY 환경변수가 없습니다. react-scripts에서는 REACT_APP_ 접두사가 필요합니다.'
    );
  }

  let lastSuccessfulItems: RecruitmentNotice[] = [];

  for (const step of REQUEST_STEPS) {
    const params = new URLSearchParams({
      serviceKey: rawDataServiceKey,
      pageNo: '1',
      numOfRows: String(step),
    });

    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
      method: 'GET',
      signal,
    });

    if (!response.ok) {
      throw new Error(`모병 모집 API 요청이 실패했습니다. (${response.status})`);
    }

    const xmlText = await response.text();
    const parsedItems = parseRecruitmentXml(xmlText);

    if (parsedItems.length > 0) {
      lastSuccessfulItems = parsedItems;
    }
  }

  return dedupeRecruitmentNotices(lastSuccessfulItems).slice(0, 30);
};

export const getSuggestionList = (notices: RecruitmentNotice[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const matchingNotices = notices.filter((notice) =>
    [notice.title, notice.category, notice.branch, notice.specialty, notice.unit, ...notice.tags].some(
      (term) => term.toLowerCase().includes(normalizedQuery)
    )
  );

  const seen = new Set<string>();
  const suggestions: string[] = [];

  matchingNotices.forEach((notice) => {
    notice.tags.forEach((tag) => {
      if (!tag.toLowerCase().includes(normalizedQuery) || seen.has(tag)) {
        return;
      }

      seen.add(tag);
      suggestions.push(tag);
    });
  });

  return suggestions.slice(0, 5);
};
