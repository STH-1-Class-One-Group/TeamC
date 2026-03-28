import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const rawJsonPath = path.join(frontendRoot, 'src', 'features', 'reservation', 'data', 'trainingCentersRaw.json');
const outputJsonPath = path.join(frontendRoot, 'src', 'features', 'reservation', 'data', 'trainingCenters.generated.json');
const envPath = path.join(frontendRoot, '.env');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SIDO_ALIASES = {
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

const readEnvFile = async (targetPath) => {
  try {
    const content = await fs.readFile(targetPath, 'utf8');
    return content.split(/\r?\n/).reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return env;
      }

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, equalIndex).trim();
      const value = trimmed.slice(equalIndex + 1).trim();
      env[key] = value;
      return env;
    }, {});
  } catch {
    return {};
  }
};

const envFromFile = await readEnvFile(envPath);
const kakaoAppKey = process.env.REACT_APP_KAKAO_MAP_KEY || envFromFile.REACT_APP_KAKAO_MAP_KEY;

if (!kakaoAppKey) {
  throw new Error('REACT_APP_KAKAO_MAP_KEY is required to generate training center coordinates.');
}

const kaHeader = 'sdk/1.0 os/javascript origin/http://localhost:3000';
const requestCache = new Map();
const coordinateCache = new Map();
const zonePointCache = new Map();

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();
const normalizeForCompare = (value) =>
  normalizeWhitespace(value).replace(/[()\[\]{}.,/·\-–—_:]/g, '').replace(/\s+/g, '').toLowerCase();
const stripAngleBrackets = (value) => normalizeWhitespace(value.replace(/<[^>]*>/g, ' '));
const stripParens = (value) => normalizeWhitespace(value.replace(/\([^)]*\)/g, ' '));
const stripSpecialHints = (value) =>
  normalizeWhitespace(
    value
      .replace(/네이버지도.*$/g, ' ')
      .replace(/TMAP.*$/gi, ' ')
      .replace(/우\)\s*[\d-]*/g, ' ')
      .replace(/\b행정안내실\b/g, ' ')
      .replace(/\b동원훈련장\b/g, ' ')
      .replace(/\b예비군면대\b/g, ' ')
  );
const replaceSidoWithAlias = (value, sido) => {
  const alias = SIDO_ALIASES[sido];
  return alias ? normalizeWhitespace(value.replace(sido, alias)) : value;
};
const removeLeadingSido = (value, sido) => normalizeWhitespace(value.replace(sido, ' '));
const normalizeName = (value) =>
  normalizeWhitespace(
    stripParens(value)
      .replace(/[\/·]/g, ' ')
      .replace(/\b예비군관리대\b/g, ' ')
      .replace(/\b예비군훈련장\b/g, ' 예비군훈련장')
  );
const simplifyMergeName = (value) =>
  normalizeForCompare(normalizeName(value))
    .replace(/지역/g, '')
    .replace(/과학화/g, '')
    .replace(/예비군훈련장/g, '')
    .replace(/예비군훈련대/g, '')
    .replace(/예비군훈련/g, '')
    .replace(/예비군/g, '')
    .replace(/훈련장/g, '')
    .replace(/훈련대/g, '');

const toMarkerLabel = (name) => {
  const compact = normalizeWhitespace(name);
  return compact.length <= 12 ? compact : compact.slice(0, 12).trimEnd();
};

const requestKakao = async (endpoint, query) => {
  const cacheKey = `${endpoint}:${query}`;
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  await sleep(120);

  const url = new URL(`https://dapi.kakao.com/v2/local/search/${endpoint}.json`);
  url.searchParams.set('query', query);

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${kakaoAppKey}`,
      KA: kaHeader,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Kakao ${endpoint} search failed (${response.status}): ${body}`);
  }

  const json = await response.json();
  requestCache.set(cacheKey, json);
  return json;
};

const buildAddressQueries = (address, sido) => {
  const cleaned = stripSpecialHints(stripParens(stripAngleBrackets(address)));
  const variants = [
    address,
    stripAngleBrackets(address),
    stripParens(address),
    stripParens(stripAngleBrackets(address)),
    cleaned,
  ];

  return [
    ...new Set(
      variants
        .flatMap((candidate) => [
          candidate,
          replaceSidoWithAlias(candidate, sido),
          removeLeadingSido(candidate, sido),
        ])
        .map(normalizeWhitespace)
        .filter(Boolean)
    ),
  ];
};

const buildKeywordQueries = (item, addressQueries) => {
  const zoneToken = item.zone.split(' ')[0];
  const normalizedNameValue = normalizeName(item.name);
  const normalizedNameWithoutSpace = normalizeForCompare(normalizedNameValue);
  const cleanedAddress = addressQueries[addressQueries.length - 1] || item.address;

  return [
    ...new Set(
      [
        item.name,
        normalizedNameValue,
        normalizedNameWithoutSpace,
        `${item.name} ${item.zone}`,
        `${normalizedNameValue} ${item.zone}`,
        `${normalizedNameValue} ${zoneToken}`,
        `${normalizedNameValue} ${item.sido}`,
        `${normalizedNameValue} ${SIDO_ALIASES[item.sido] ?? item.sido}`,
        `${normalizedNameValue} ${cleanedAddress}`,
        cleanedAddress,
      ]
        .map(normalizeWhitespace)
        .filter(Boolean)
    ),
  ];
};

const collectAddressText = (document) =>
  normalizeWhitespace(
    [
      document.address_name,
      document.road_address_name,
      document.place_name,
      document.address?.address_name,
      document.road_address?.address_name,
    ]
      .filter(Boolean)
      .join(' ')
  );

const scoreDocument = (item, query, document) => {
  const addressText = collectAddressText(document);
  const normalizedAddressText = normalizeForCompare(addressText);
  const normalizedQuery = normalizeForCompare(query);
  const normalizedNameValue = normalizeForCompare(normalizeName(item.name));
  const normalizedZone = normalizeForCompare(item.zone);
  const normalizedZoneToken = normalizeForCompare(item.zone.split(' ')[0]);
  const normalizedSido = normalizeForCompare(item.sido);
  const normalizedSidoAlias = normalizeForCompare(SIDO_ALIASES[item.sido] ?? '');
  let score = 0;

  if (
    normalizedAddressText.includes(normalizedSido) ||
    (normalizedSidoAlias && normalizedAddressText.includes(normalizedSidoAlias))
  ) {
    score += 4;
  }
  if (normalizedAddressText.includes(normalizedZone)) {
    score += 4;
  } else if (normalizedAddressText.includes(normalizedZoneToken)) {
    score += 2;
  }
  if (normalizedAddressText.includes(normalizedNameValue)) {
    score += 3;
  }
  if (normalizedAddressText.includes(normalizedQuery)) {
    score += 2;
  }
  if (
    document.place_name &&
    normalizedNameValue.includes(normalizeForCompare(document.place_name))
  ) {
    score += 2;
  }

  return score;
};

const toPoint = (document) => {
  const lat = Number.parseFloat(document.y);
  const lng = Number.parseFloat(document.x);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
};

const geocodeByQueries = async (item, endpoint, queries) => {
  for (const query of queries) {
    const result = await requestKakao(endpoint, query);
    if (!Array.isArray(result.documents) || result.documents.length === 0) {
      continue;
    }

    const ranked = result.documents
      .map((document) => ({
        document,
        score: scoreDocument(item, query, document),
      }))
      .sort((left, right) => right.score - left.score);

    const best = ranked[0];
    const point = best ? toPoint(best.document) : null;
    if (point) {
      return point;
    }
  }

  return null;
};

const getZoneFallbackPoint = async (item) => {
  const cacheKey = `${item.sido}::${item.zone}`;
  if (zonePointCache.has(cacheKey)) {
    return zonePointCache.get(cacheKey);
  }

  const queries = [
    `${item.sido} ${item.zone}`,
    `${SIDO_ALIASES[item.sido] ?? item.sido} ${item.zone}`,
    item.zone,
    item.zone.split(' ')[0],
  ];

  const addressPoint = await geocodeByQueries(item, 'address', queries);
  if (addressPoint) {
    zonePointCache.set(cacheKey, addressPoint);
    return addressPoint;
  }

  const keywordPoint = await geocodeByQueries(item, 'keyword', queries);
  zonePointCache.set(cacheKey, keywordPoint);
  return keywordPoint;
};

const geocodeTrainingCenter = async (item) => {
  const addressQueries = buildAddressQueries(item.address, item.sido);
  const cleanedAddressCacheKey = addressQueries[addressQueries.length - 1] || item.address;
  if (coordinateCache.has(cleanedAddressCacheKey)) {
    return coordinateCache.get(cleanedAddressCacheKey);
  }

  const addressPoint = await geocodeByQueries(item, 'address', addressQueries);
  if (addressPoint) {
    coordinateCache.set(cleanedAddressCacheKey, addressPoint);
    return addressPoint;
  }

  const keywordQueries = buildKeywordQueries(item, addressQueries);
  const keywordPoint = await geocodeByQueries(item, 'keyword', keywordQueries);
  if (keywordPoint) {
    coordinateCache.set(cleanedAddressCacheKey, keywordPoint);
    return keywordPoint;
  }

  const zoneFallbackPoint = await getZoneFallbackPoint(item);
  if (zoneFallbackPoint) {
    coordinateCache.set(cleanedAddressCacheKey, zoneFallbackPoint);
  }

  return zoneFallbackPoint;
};

const rawItems = JSON.parse(await fs.readFile(rawJsonPath, 'utf8'));
const generated = [];
const failures = [];

for (const [index, item] of rawItems.entries()) {
  const point = await geocodeTrainingCenter(item);

  if (!point) {
    failures.push({
      index,
      id: item.id,
      name: item.name,
      sido: item.sido,
      zone: item.zone,
      address: item.address,
    });
    continue;
  }

  generated.push({
    id: `${item.id}-${index}`,
    name: item.name,
    sido: item.sido,
    zone: item.zone,
    address: item.address,
    phone: item.phone || '',
    status: 'Active',
    lat: point.lat,
    lng: point.lng,
    markerLabel: toMarkerLabel(item.name),
  });
}

if (failures.length > 0) {
  throw new Error(
    `Failed to geocode ${failures.length} training centers:\n${JSON.stringify(failures, null, 2)}`
  );
}

const mergedMap = new Map();

for (const item of generated) {
  const mergeKey = `${item.lat.toFixed(6)},${item.lng.toFixed(6)}::${simplifyMergeName(item.name)}`;
  const current = mergedMap.get(mergeKey);

  if (!current) {
    mergedMap.set(mergeKey, {
      ...item,
      zones: [item.zone],
      aliases: [item.name],
      sourceCount: 1,
      _phones: item.phone ? [item.phone] : [],
      _nameCounts: { [item.name]: 1 },
    });
    continue;
  }

  current.sourceCount += 1;
  current.zones = [...new Set([...current.zones, item.zone])].sort();
  current.aliases = [...new Set([...current.aliases, item.name])].sort();
  current._phones = [...new Set([...current._phones, ...(item.phone ? [item.phone] : [])])];
  current._nameCounts[item.name] = (current._nameCounts[item.name] || 0) + 1;
}

const merged = [...mergedMap.values()]
  .map((item) => {
    const canonicalName = Object.entries(item._nameCounts).sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return right[0].length - left[0].length;
    })[0][0];

    return {
      id: item.id,
      name: canonicalName,
      sido: item.sido,
      zone: item.zones[0],
      zones: item.zones,
      aliases: item.aliases,
      sourceCount: item.sourceCount,
      address: item.address,
      phone: item._phones.join(' / '),
      status: item.status,
      lat: item.lat,
      lng: item.lng,
      markerLabel: toMarkerLabel(canonicalName),
    };
  })
  .sort((left, right) => {
    if (left.sido !== right.sido) {
      return left.sido.localeCompare(right.sido, 'ko');
    }
    if (left.zone !== right.zone) {
      return left.zone.localeCompare(right.zone, 'ko');
    }
    return left.name.localeCompare(right.name, 'ko');
  });

await fs.writeFile(outputJsonPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

console.log(`Generated ${generated.length} training centers with coordinates.`);
console.log(`Merged down to ${merged.length} unique training centers.`);
