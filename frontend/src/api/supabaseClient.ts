import { createClient } from '@supabase/supabase-js';

// .env 파일에 설정된 Supabase 환경 변수들을 가져옵니다.
// 유저가 직접 값을 입력할 예정이므로 빈 문자열로 초기화되도록 처리합니다.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
