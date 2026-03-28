-- ============================================================
-- Modern Sentinel - Supabase/Postgres Best Practices Patch
-- 목적:
-- 1) 외래키 인덱스 누락 보강
-- 2) 장바구니/북마크 중복 방지용 유니크 인덱스 후보 추가
-- 3) defense_news.published_at(text)의 안전한 timestamptz 그림자 컬럼 추가
-- 4) 운영 중인 데이터가 있어도 최대한 실패하지 않도록 idempotent하게 작성
--
-- 참고 기준:
-- - query-missing-indexes
-- - query-composite-indexes
-- - schema-foreign-key-indexes
-- - schema-data-types
-- - schema-constraints
-- - security-rls-performance
-- ============================================================

-- ------------------------------------------------------------
-- 1. FK / JOIN / WHERE 컬럼 인덱스 보강
--    Postgres는 foreign key에 자동 인덱스를 만들지 않음
-- ------------------------------------------------------------
create index if not exists bookmarks_news_user_id_idx
  on public.bookmarks_news (user_id);

create index if not exists bookmarks_news_news_id_idx
  on public.bookmarks_news (news_id);

create index if not exists cart_items_user_id_idx
  on public.cart_items (user_id);

create index if not exists cart_items_food_id_idx
  on public.cart_items (food_id);

create index if not exists community_posts_author_id_idx
  on public.community_posts (author_id);

create index if not exists community_comments_post_id_created_at_idx
  on public.community_comments (post_id, created_at);

create index if not exists community_comments_author_id_idx
  on public.community_comments (author_id);

create index if not exists community_post_votes_post_id_vote_type_idx
  on public.community_post_votes (post_id, vote_type);

create index if not exists community_post_votes_user_id_idx
  on public.community_post_votes (user_id);

create index if not exists food_media_food_id_idx
  on public.food_media (food_id);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_food_id_idx
  on public.order_items (food_id);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

create index if not exists training_media_training_id_idx
  on public.training_media (training_id);

create index if not exists user_coupons_user_id_idx
  on public.user_coupons (user_id);

create index if not exists user_coupons_coupon_id_idx
  on public.user_coupons (coupon_id);

create index if not exists user_coupons_available_idx
  on public.user_coupons (user_id, created_at desc)
  where is_used = false;


-- ------------------------------------------------------------
-- 2. bookmarks_news 정합성 보강
--    현재 전체 스키마 기준으로 user_id/news_id에 random uuid default가 있어
--    잘못된 레코드가 생성될 위험이 큼
-- ------------------------------------------------------------
alter table public.bookmarks_news
  alter column user_id drop default,
  alter column news_id drop default;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookmarks_news_user_id_fkey'
      and conrelid = 'public.bookmarks_news'::regclass
  ) then
    alter table public.bookmarks_news
      add constraint bookmarks_news_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookmarks_news_news_id_fkey'
      and conrelid = 'public.bookmarks_news'::regclass
  ) then
    alter table public.bookmarks_news
      add constraint bookmarks_news_news_id_fkey
      foreign key (news_id)
      references public.defense_news(id)
      not valid;
  end if;
end $$;

do $$
declare
  has_duplicate_pairs boolean;
begin
  select exists (
    select 1
    from (
      select user_id, news_id
      from public.bookmarks_news
      group by user_id, news_id
      having count(*) > 1
    ) as duplicated_pairs
  )
  into has_duplicate_pairs;

  if not has_duplicate_pairs then
    execute '
      create unique index if not exists bookmarks_news_user_news_uidx
        on public.bookmarks_news (user_id, news_id)
    ';
  else
    raise notice 'Skipping bookmarks_news_user_news_uidx because duplicate (user_id, news_id) rows already exist.';
  end if;
end $$;


-- ------------------------------------------------------------
-- 3. cart_items 한 사용자-상품 1행 보장 후보
--    장바구니는 보통 수량 합산 모델이므로 unique(user_id, food_id)가 유리
--    단, 기존 중복 데이터가 있으면 실패하지 않도록 조건부 생성
-- ------------------------------------------------------------
do $$
declare
  has_duplicate_cart_items boolean;
begin
  select exists (
    select 1
    from (
      select user_id, food_id
      from public.cart_items
      group by user_id, food_id
      having count(*) > 1
    ) as duplicated_cart_items
  )
  into has_duplicate_cart_items;

  if not has_duplicate_cart_items then
    execute '
      create unique index if not exists cart_items_user_food_uidx
        on public.cart_items (user_id, food_id)
    ';
  else
    execute '
      create index if not exists cart_items_user_food_idx
        on public.cart_items (user_id, food_id)
    ';
    raise notice 'Skipping cart_items_user_food_uidx because duplicate cart rows already exist. Non-unique index created instead.';
  end if;
end $$;


-- ------------------------------------------------------------
-- 4. defense_news.published_at(text) 개선 준비
--    기존 text 컬럼은 유지하되, 안전한 timestamptz shadow column 추가
--    앱이 준비되면 published_at_ts로 정렬/검색 전환 가능
-- ------------------------------------------------------------
create or replace function public.safe_parse_timestamptz(p_value text)
returns timestamptz
language plpgsql
stable
as $$
begin
  if p_value is null or btrim(p_value) = '' then
    return null;
  end if;

  begin
    return p_value::timestamptz;
  exception
    when others then
      return null;
  end;
end;
$$;

comment on function public.safe_parse_timestamptz is 'Parses text to timestamptz and returns null on failure.';

alter table public.defense_news
  add column if not exists published_at_ts timestamptz;

update public.defense_news
set published_at_ts = public.safe_parse_timestamptz(published_at)
where published_at_ts is null
  and published_at is not null;

create index if not exists defense_news_published_at_ts_idx
  on public.defense_news (published_at_ts desc nulls last);


-- ------------------------------------------------------------
-- 5. 선택 검증 쿼리
-- ------------------------------------------------------------
-- select
--   conrelid::regclass as table_name,
--   a.attname as fk_column
-- from pg_constraint c
-- join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
-- where c.contype = 'f'
--   and not exists (
--     select 1
--     from pg_index i
--     where i.indrelid = c.conrelid
--       and a.attnum = any(i.indkey)
--   );
--
-- select *
-- from public.bookmarks_news
-- where user_id is null or news_id is null;
--
-- select user_id, news_id, count(*)
-- from public.bookmarks_news
-- group by user_id, news_id
-- having count(*) > 1;
