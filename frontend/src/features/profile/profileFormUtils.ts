import { supabase } from '../../api/supabaseClient';
import { getRankAvatarPath } from '../../utils/profileAvatar';
import { ProfileFormValues } from './types';

export const PROFILE_RANKS = [
  '이병', '일병', '상병', '병장',
  '하사', '중사', '상사', '원사', '준위',
  '소위', '중위', '대위', '소령', '중령', '대령',
  '준장', '소장', '중장', '대장',
];

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

export const saveProfile = async (userId: string, values: ProfileFormValues) =>
  supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        nickname: values.nickname.trim(),
        rank: values.rank || null,
        unit: values.unit.trim() || null,
        enlistment_date: values.enlistmentDate || null,
        profile_completed: true,
        avatar_url: getRankAvatarPath(values.rank || null),
      },
      {
        onConflict: 'id',
      }
    )
    .select()
    .single();
