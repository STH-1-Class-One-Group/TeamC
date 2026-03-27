import { supabase } from '../api/supabaseClient';
import { getDisplayRank } from './serviceDates';

export interface AvatarProfileLike {
  avatar_url?: string | null;
  rank?: string | null;
  user_type?: string | null;
  service_track?: string | null;
  enlistment_date?: string | null;
}

export const PROFILE_IMAGE_BUCKET = 'profile-images';
export const DEFAULT_PROFILE_AVATAR_PATH = 'default.png';
export const RANK_AVATAR_PATHS: Record<string, string> = {
  '이병': '0.png',
  '일병': '1.png',
  '상병': '2.png',
  '병장': '3.png',
  '하사': '4.png',
  '중사': '5.png',
  '상사': '6.png',
  '원사': '7.png',
  '준위': '8.png',
  '소위': '9.png',
  '중위': '10.png',
  '대위': '11.png',
  '소령': '12.png',
  '중령': '13.png',
  '대령': '14.png',
  '준장': '15.png',
  '소장': '16.png',
  '중장': '17.png',
  '대장': '18.png',
};

const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

const normalizeAvatarPath = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/^\/+/, '') : null;
};

export const getRankAvatarPath = (rank?: string | null): string => {
  const normalizedRank = rank?.trim();
  return normalizedRank ? (RANK_AVATAR_PATHS[normalizedRank] ?? DEFAULT_PROFILE_AVATAR_PATH) : DEFAULT_PROFILE_AVATAR_PATH;
};

export const getProfileAvatarPath = (profile?: AvatarProfileLike | null): string => {
  const displayRank = getDisplayRank({
    userType: profile?.user_type,
    serviceTrack: profile?.service_track,
    enlistmentDate: profile?.enlistment_date,
    rank: profile?.rank,
  });

  if (displayRank) {
    return getRankAvatarPath(displayRank);
  }

  const avatarPath = normalizeAvatarPath(profile?.avatar_url);

  if (avatarPath && !EXTERNAL_URL_PATTERN.test(avatarPath)) {
    return avatarPath;
  }

  return DEFAULT_PROFILE_AVATAR_PATH;
};

export const getStorageAvatarUrl = (path: string): string =>
  supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;

export const getDefaultProfileAvatarUrl = (): string =>
  getStorageAvatarUrl(DEFAULT_PROFILE_AVATAR_PATH);

export const getProfileAvatarUrl = (profile?: AvatarProfileLike | null): string =>
  getStorageAvatarUrl(getProfileAvatarPath(profile));
