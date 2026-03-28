-- ============================================================
-- Modern Sentinel - Community Votes Patch
-- 기존 community 스키마에 추천/비추천 기능을 추가합니다.
-- Supabase SQL Editor 또는 DB 접속 환경에서 실행하세요.
-- ============================================================

alter table public.community_posts
  add column if not exists upvotes integer not null default 0,
  add column if not exists downvotes integer not null default 0;

comment on column public.community_posts.upvotes is '게시글 추천 수';
comment on column public.community_posts.downvotes is '게시글 비추천 수';

create table if not exists public.community_post_votes (
  post_id     uuid not null references public.community_posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  vote_type   text not null check (vote_type in ('up', 'down')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

comment on table public.community_post_votes is '게시글 추천/비추천 기록';

alter table public.community_post_votes enable row level security;

create index if not exists community_post_votes_post_id_vote_type_idx
  on public.community_post_votes (post_id, vote_type);

create index if not exists community_post_votes_user_id_idx
  on public.community_post_votes (user_id);

drop policy if exists "post_votes: 본인 조회" on public.community_post_votes;
create policy "post_votes: 본인 조회"
  on public.community_post_votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "post_votes: 본인 생성" on public.community_post_votes;
create policy "post_votes: 본인 생성"
  on public.community_post_votes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "post_votes: 본인 수정" on public.community_post_votes;
create policy "post_votes: 본인 수정"
  on public.community_post_votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "post_votes: 본인 삭제" on public.community_post_votes;
create policy "post_votes: 본인 삭제"
  on public.community_post_votes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop trigger if exists trg_post_votes_updated_at on public.community_post_votes;
create trigger trg_post_votes_updated_at
  before update on public.community_post_votes
  for each row execute function public.set_updated_at();

create or replace function public.set_post_vote(p_post_id uuid, p_vote_type text)
returns table (
  upvotes integer,
  downvotes integer,
  viewer_vote text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_existing_vote text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_vote_type not in ('up', 'down') then
    raise exception 'Invalid vote type: %', p_vote_type;
  end if;

  if not exists (
    select 1
    from public.community_posts
    where id = p_post_id
  ) then
    raise exception 'Post not found';
  end if;

  select vote_type
  into v_existing_vote
  from public.community_post_votes
  where post_id = p_post_id
    and user_id = v_user_id;

  if v_existing_vote = p_vote_type then
    delete from public.community_post_votes
    where post_id = p_post_id
      and user_id = v_user_id;

    viewer_vote := null;
  elsif v_existing_vote is null then
    insert into public.community_post_votes (post_id, user_id, vote_type)
    values (p_post_id, v_user_id, p_vote_type);

    viewer_vote := p_vote_type;
  else
    update public.community_post_votes
    set vote_type = p_vote_type,
        updated_at = now()
    where post_id = p_post_id
      and user_id = v_user_id;

    viewer_vote := p_vote_type;
  end if;

  update public.community_posts
  set
    upvotes = (
      select count(*)
      from public.community_post_votes
      where post_id = p_post_id
        and vote_type = 'up'
    ),
    downvotes = (
      select count(*)
      from public.community_post_votes
      where post_id = p_post_id
        and vote_type = 'down'
    )
  where id = p_post_id
  returning community_posts.upvotes, community_posts.downvotes
  into upvotes, downvotes;

  return next;
end;
$$;

comment on function public.set_post_vote is '게시글 추천/비추천 설정 및 토글';

grant execute on function public.set_post_vote(uuid, text) to authenticated;

update public.community_posts as posts
set
  upvotes = counts.upvotes,
  downvotes = counts.downvotes
from (
  select
    post_id,
    count(*) filter (where vote_type = 'up')::integer as upvotes,
    count(*) filter (where vote_type = 'down')::integer as downvotes
  from public.community_post_votes
  group by post_id
) as counts
where posts.id = counts.post_id;
