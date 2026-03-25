-- ============================================================
-- Modern Sentinel - Community RLS performance patch
-- 기존 community RLS 정책을 Supabase 권장 성능 패턴으로 교체합니다.
-- Supabase 대시보드 SQL Editor에서 1회 실행하세요.
-- ============================================================

begin;

drop policy if exists "profiles: 본인만 생성" on public.profiles;
drop policy if exists "profiles: 본인만 수정" on public.profiles;

create policy "profiles: 본인만 생성"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles: 본인만 수정"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "posts: 인증 사용자만 작성" on public.community_posts;
drop policy if exists "posts: 본인만 수정" on public.community_posts;
drop policy if exists "posts: 본인만 삭제" on public.community_posts;

create policy "posts: 인증 사용자만 작성"
  on public.community_posts for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "posts: 본인만 수정"
  on public.community_posts for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "posts: 본인만 삭제"
  on public.community_posts for delete
  to authenticated
  using ((select auth.uid()) = author_id);

drop policy if exists "comments: 인증 사용자만 작성" on public.community_comments;
drop policy if exists "comments: 본인만 삭제" on public.community_comments;

create policy "comments: 인증 사용자만 작성"
  on public.community_comments for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "comments: 본인만 삭제"
  on public.community_comments for delete
  to authenticated
  using ((select auth.uid()) = author_id);

commit;
