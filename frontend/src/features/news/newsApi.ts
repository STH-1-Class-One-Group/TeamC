import { supabase } from '../../api/supabaseClient';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface NewsItemPayload {
  id?: string;
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
}

export interface NewsBookmark {
  id: number;
  newsId: string;
  createdAt: string;
}

const getNewsRequestHeaders = async (): Promise<HeadersInit> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  const token = session?.access_token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const fetchNewsBatch = async (
  limit: number,
  start: number,
  options?: { signal?: AbortSignal; forceRefresh?: boolean }
) => {
  const headers = await getNewsRequestHeaders();
  const params = new URLSearchParams({
    limit: String(limit),
    start: String(start),
    force_refresh: options?.forceRefresh ? 'true' : 'false',
  });

  return fetch(`${apiUrl}/api/v1/news?${params.toString()}`, {
    signal: options?.signal,
    headers,
  });
};

export const fetchNewsDebug = async (
  limit: number,
  start: number,
  options?: { signal?: AbortSignal; forceRefresh?: boolean }
) => {
  const headers = await getNewsRequestHeaders();
  const params = new URLSearchParams({
    limit: String(limit),
    start: String(start),
    force_refresh: options?.forceRefresh ? 'true' : 'false',
  });

  return fetch(`${apiUrl}/api/v1/news/debug?${params.toString()}`, {
    signal: options?.signal,
    headers,
  });
};

export const fetchNewsBookmarks = async (options?: { signal?: AbortSignal }) => {
  const headers = await getNewsRequestHeaders();

  return fetch(`${apiUrl}/api/v1/news/bookmarks`, {
    signal: options?.signal,
    headers,
  });
};

export const createNewsBookmark = async (
  news: NewsItemPayload,
  options?: { signal?: AbortSignal }
) => {
  const headers = await getNewsRequestHeaders();

  return fetch(`${apiUrl}/api/v1/news/bookmarks`, {
    method: 'POST',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      news_id: news.id || null,
      news,
    }),
  });
};

export const deleteNewsBookmark = async (
  newsId: string,
  options?: { signal?: AbortSignal }
) => {
  const headers = await getNewsRequestHeaders();

  return fetch(`${apiUrl}/api/v1/news/bookmarks/${encodeURIComponent(newsId)}`, {
    method: 'DELETE',
    signal: options?.signal,
    headers,
  });
};
