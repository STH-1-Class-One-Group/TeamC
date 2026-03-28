import { createClient } from '@supabase/supabase-js';

// .env 파일에 설정된 Supabase 환경 변수들을 가져옵니다.
const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

// 환경 변수가 제대로 설정되었는지 확인하는 플래그
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const SUPABASE_CONFIG_ERROR_MESSAGE =
  'Supabase 브라우저 설정이 없습니다. REACT_APP_SUPABASE_URL과 REACT_APP_SUPABASE_ANON_KEY를 설정해 주세요.';

// 빈 문자열로 클라이언트를 생성하면 에러가 발생하므로, 값이 없을 경우 임시 URL을 사용합니다.
// (실제 데이터 요청은 hasSupabaseConfig가 true일 때만 실행하는 것이 좋습니다.)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const getSupabaseConfigErrorMessage = () => SUPABASE_CONFIG_ERROR_MESSAGE;

export const getSupabaseErrorMessage = (error: unknown) => {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message || '')
      : '';

  if (message.includes('API key')) {
    return 'Supabase API key is not recognized. Please check your environment variables.';
  }

  if (message.includes('JWT') || message.includes('row-level security')) {
    return 'Supabase rejected the request. Check the anon key and your table policies.';
  }

  return message || 'Failed to communicate with Supabase.';
};

export const getSupabaseRuntimeErrorMessage = (
  error: unknown,
  fallback = 'Supabase 데이터를 불러오지 못했습니다.'
) => {
  if (!hasSupabaseConfig) {
    return SUPABASE_CONFIG_ERROR_MESSAGE;
  }

  const message = getSupabaseErrorMessage(error);
  if (message.includes('Supabase browser client is not configured')) {
    return SUPABASE_CONFIG_ERROR_MESSAGE;
  }

  return message || fallback;
};
