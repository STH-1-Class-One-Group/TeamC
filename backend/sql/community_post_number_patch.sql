-- ============================================================
-- Modern Sentinel - Community post_number patch
-- 기존 community_posts 테이블에 게시판 번호를 추가합니다.
-- Supabase 대시보드 SQL Editor에서 1회 실행하세요.
-- ============================================================

create sequence if not exists public.community_posts_post_number_seq;

alter table public.community_posts
  add column if not exists post_number bigint;

alter table public.community_posts
  alter column post_number set default nextval('public.community_posts_post_number_seq');

alter sequence public.community_posts_post_number_seq
  owned by public.community_posts.post_number;

with numbered_posts as (
  select
    id,
    row_number() over (order by created_at asc, id asc)
      + coalesce((select max(post_number) from public.community_posts where post_number is not null), 0) as next_number
  from public.community_posts
  where post_number is null
)
update public.community_posts as posts
set post_number = numbered_posts.next_number
from numbered_posts
where posts.id = numbered_posts.id;

select setval(
  'public.community_posts_post_number_seq',
  coalesce((select max(post_number) from public.community_posts), 0) + 1,
  false
);

alter table public.community_posts
  alter column post_number set not null;

create unique index if not exists community_posts_post_number_key
  on public.community_posts (post_number);

comment on column public.community_posts.post_number is '커뮤니티 게시판 고유 번호';
