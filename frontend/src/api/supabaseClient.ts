import { createClient } from '@supabase/supabase-js';

// .env 파일에 설정된 Supabase 환경 변수들을 가져옵니다.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// 환경 변수가 제대로 설정되었는지 확인하는 플래그
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

// 빈 문자열로 클라이언트를 생성하면 에러가 발생하므로, 값이 없을 경우 임시 URL을 사용합니다.
// (실제 데이터 요청은 hasSupabaseConfig가 true일 때만 실행하는 것이 좋습니다.)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

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
