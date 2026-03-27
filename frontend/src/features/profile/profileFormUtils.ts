import { supabase } from '../../api/supabaseClient';
import { getRankAvatarPath } from '../../utils/profileAvatar';
import {
  ACQUAINTANCE_SERVICE_TRACK_OPTIONS,
  CADET_CATEGORY_OPTIONS,
  getCadreRankOptions,
  USER_TYPE_OPTIONS,
  SERVICE_TRACK_OPTIONS,
} from '../../utils/serviceDates';
import { ProfileFormValues } from './types';

export const PROFILE_USER_TYPE_OPTIONS = USER_TYPE_OPTIONS;
export const PROFILE_CADRE_CATEGORY_OPTIONS = CADET_CATEGORY_OPTIONS;
export const PROFILE_SERVICE_TRACK_OPTIONS = SERVICE_TRACK_OPTIONS;
export const PROFILE_ACQUAINTANCE_SERVICE_TRACK_OPTIONS = ACQUAINTANCE_SERVICE_TRACK_OPTIONS;

export const getCadreRankFieldOptions = (cadreCategory: string | null | undefined) =>
  getCadreRankOptions(cadreCategory);

export const getTodayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getProviderLabel = (provider?: string) => {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'kakao':
      return 'Kakao';
    case 'naver':
      return 'Naver';
    default:
      return 'Social Login';
  }
};

export const isNicknameAvailable = async (nickname: string, currentUserId: string) => {
  const trimmedNickname = nickname.trim();
  if (!trimmedNickname) {
    return false;
  }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', trimmedNickname)
    .maybeSingle();

  return !data || data.id === currentUserId;
};

const getPersistedAvatarPath = (values: ProfileFormValues) => {
  if (values.userType === 'active_cadre' && values.rank.trim()) {
    return getRankAvatarPath(values.rank);
  }

  return null;
};

export const saveProfile = async (userId: string, values: ProfileFormValues) =>
  supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        nickname: values.nickname.trim(),
        user_type: values.userType || null,
        cadre_category: values.cadreCategory || null,
        rank: values.rank.trim() || null,
        unit: values.unit.trim() || null,
        enlistment_date: values.enlistmentDate || null,
        service_track: values.serviceTrack || null,
        acquaintance_name: values.acquaintanceName.trim() || null,
        acquaintance_service_track: values.acquaintanceServiceTrack || null,
        acquaintance_enlistment_date: values.acquaintanceEnlistmentDate || null,
        profile_completed: true,
        avatar_url: getPersistedAvatarPath(values),
      },
      {
        onConflict: 'id',
      }
    )
    .select()
    .single();
