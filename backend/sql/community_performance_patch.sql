-- ============================================================
-- Modern Sentinel - Community performance patch
-- 이미 생성된 community 테이블에 성능 인덱스를 추가합니다.
-- Supabase 대시보드 SQL Editor에서 1회 실행하세요.
-- ============================================================

create extension if not exists pg_trgm;

create index if not exists community_posts_author_id_idx
  on public.community_posts (author_id);

create index if not exists community_posts_category_post_number_idx
  on public.community_posts (category, post_number desc);

create index if not exists community_posts_title_trgm_idx
  on public.community_posts using gin (title gin_trgm_ops);

create index if not exists community_posts_content_trgm_idx
  on public.community_posts using gin (content gin_trgm_ops);

create index if not exists community_comments_post_id_created_at_idx
  on public.community_comments (post_id, created_at);

create index if not exists community_comments_author_id_idx
  on public.community_comments (author_id);
