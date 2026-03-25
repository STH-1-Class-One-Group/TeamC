export interface AuthorInfo {
  id: string;
  nickname: string;
  rank: string | null;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  post_number: number;
  title: string;
  content: string;
  category: string;
  views: number;
  created_at: string;
  updated_at: string;
  author: AuthorInfo;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  per_page: number;
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  author: AuthorInfo;
}

export const CATEGORIES: Record<string, string> = {
  general: '자유게시판',
  question: '질문게시판',
  info: '정보공유',
};

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(isoString).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatBoardDate(isoString: string): string {
  const date = new Date(isoString);
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
