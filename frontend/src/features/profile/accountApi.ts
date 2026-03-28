import { supabase } from '../../api/supabaseClient';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const ACCOUNT_DELETION_CONFIRMATION_TEXT = '회원탈퇴';

export const deleteCurrentAccount = async (confirmationText: string) => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('로그인 정보를 확인하지 못했습니다. 다시 로그인 후 시도해주세요.');
  }

  const response = await fetch(`${apiUrl}/api/v1/auth/me/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      confirmation_text: confirmationText,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload
        ? String((payload as { detail?: string }).detail || '')
        : '';

    throw new Error(detail || '회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }

  return response.json();
};
