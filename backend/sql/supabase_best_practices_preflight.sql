-- ============================================================
-- Modern Sentinel - Supabase/Postgres Best Practices Preflight
-- 목적:
--   보강용 migration을 넣기 전에 운영 데이터가 안전한지 읽기 전용으로 점검
--
-- 특징:
--   - SELECT 전용
--   - 데이터 변경 없음
--   - Supabase SQL Editor에서 그대로 실행 가능
--
-- 확인 대상:
--   1) bookmarks_news 정합성 문제
--   2) cart_items 중복 문제
--   3) defense_news.published_at 형식 점검
--   4) FK 인덱스 누락 점검
--   5) RLS 적용 여부 참고 점검
-- ============================================================

-- ------------------------------------------------------------
-- 0. 현재 상태 요약
-- ------------------------------------------------------------
select
  'public.bookmarks_news' as table_name,
  count(*) as row_count
from public.bookmarks_news
union all
select
  'public.cart_items' as table_name,
  count(*) as row_count
from public.cart_items
union all
select
  'public.defense_news' as table_name,
  count(*) as row_count
from public.defense_news
union all
select
  'public.community_posts' as table_name,
  count(*) as row_count
from public.community_posts;


-- ------------------------------------------------------------
-- 1. bookmarks_news 점검
--    위험 이유:
--    - 전체 스키마 기준 user_id/news_id에 random uuid default가 있었음
--    - FK와 unique(user_id, news_id) 추가 전 데이터 오염 여부 확인 필요
-- ------------------------------------------------------------

-- 1-1. null / orphan / 정상 참조 개수
select
  count(*) as total_rows,
  count(*) filter (where bn.user_id is null) as null_user_id_rows,
  count(*) filter (where bn.news_id is null) as null_news_id_rows,
  count(*) filter (where bn.user_id is not null and au.id is null) as orphan_user_rows,
  count(*) filter (where bn.news_id is not null and dn.id is null) as orphan_news_rows
from public.bookmarks_news bn
left join auth.users au on au.id = bn.user_id
left join public.defense_news dn on dn.id = bn.news_id;

-- 1-2. user_id/news_id 중복 여부 요약
select
  count(*) as duplicate_pair_count
from (
  select user_id, news_id
  from public.bookmarks_news
  group by user_id, news_id
  having count(*) > 1
) duplicated_pairs;

-- 1-3. 중복 상세 샘플
select
  user_id,
  news_id,
  count(*) as row_count
from public.bookmarks_news
group by user_id, news_id
having count(*) > 1
order by row_count desc, user_id, news_id
limit 30;

-- 1-4. orphan 상세 샘플
select
  bn.id,
  bn.user_id,
  bn.news_id,
  bn.created_at
from public.bookmarks_news bn
left join auth.users au on au.id = bn.user_id
left join public.defense_news dn on dn.id = bn.news_id
where (bn.user_id is not null and au.id is null)
   or (bn.news_id is not null and dn.id is null)
order by bn.created_at desc
limit 30;


-- ------------------------------------------------------------
-- 2. cart_items 점검
--    위험 이유:
--    - user_id + food_id가 한 사용자 장바구니에서 중복되면
--      quantity 합산 모델과 충돌
-- ------------------------------------------------------------

-- 2-1. 중복 조합 수 요약
select
  count(*) as duplicate_user_food_count
from (
  select user_id, food_id
  from public.cart_items
  group by user_id, food_id
  having count(*) > 1
) duplicated_cart_items;

-- 2-2. 중복 상세 샘플
select
  user_id,
  food_id,
  count(*) as row_count,
  sum(quantity) as total_quantity
from public.cart_items
group by user_id, food_id
having count(*) > 1
order by row_count desc, total_quantity desc
limit 30;


-- ------------------------------------------------------------
-- 3. defense_news.published_at 형식 점검
--    위험 이유:
--    - text는 정렬/필터/인덱스에 불리
--    - 실제 값이 어느 형식인지 먼저 파악해야 timestamptz 이관 가능
-- ------------------------------------------------------------

-- 3-1. 기본 분포
select
  count(*) as total_rows,
  count(*) filter (where published_at is null) as null_rows,
  count(*) filter (where btrim(coalesce(published_at, '')) = '') as blank_rows,
  count(*) filter (
    where published_at ~ '^[A-Z][a-z]{2}, [0-9]{2} [A-Z][a-z]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} [+-][0-9]{4}$'
  ) as rfc2822_like_rows,
  count(*) filter (
    where published_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}:[0-9]{2}'
  ) as iso8601_like_rows,
  count(*) filter (
    where published_at is not null
      and btrim(published_at) <> ''
      and published_at !~ '^[A-Z][a-z]{2}, [0-9]{2} [A-Z][a-z]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} [+-][0-9]{4}$'
      and published_at !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}:[0-9]{2}'
  ) as other_format_rows
from public.defense_news;

-- 3-2. 특이 형식 샘플
select
  published_at,
  count(*) as row_count
from public.defense_news
where published_at is not null
  and btrim(published_at) <> ''
  and published_at !~ '^[A-Z][a-z]{2}, [0-9]{2} [A-Z][a-z]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} [+-][0-9]{4}$'
  and published_at !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}:[0-9]{2}'
group by published_at
order by row_count desc, published_at
limit 30;


-- ------------------------------------------------------------
-- 4. FK 인덱스 누락 점검
--    Supabase best practices: FK 컬럼은 직접 인덱싱 권장
-- ------------------------------------------------------------
select
  c.conrelid::regclass as table_name,
  a.attname as fk_column
from pg_constraint c
join pg_attribute a
  on a.attrelid = c.conrelid
 and a.attnum = any(c.conkey)
where c.contype = 'f'
  and c.connamespace = 'public'::regnamespace
  and not exists (
    select 1
    from pg_index i
    where i.indrelid = c.conrelid
      and a.attnum = any(i.indkey)
  )
order by table_name::text, fk_column;


-- ------------------------------------------------------------
-- 5. 복합 인덱스 후보 확인용 액세스 패턴 참고
-- ------------------------------------------------------------
select
  'orders_user_id_created_at_idx' as recommended_index,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'orders_user_id_created_at_idx'
  ) as already_exists
union all
select
  'user_coupons_available_idx' as recommended_index,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'user_coupons_available_idx'
  ) as already_exists
union all
select
  'cart_items_user_food_uidx' as recommended_index,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'cart_items_user_food_uidx'
  ) as already_exists;


-- ------------------------------------------------------------
-- 6. RLS 참고 점검
--    user-owned 데이터인데 RLS가 꺼져 있으면 확인 필요
-- ------------------------------------------------------------
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'bookmarks_news',
    'cart_items',
    'community_posts',
    'community_comments',
    'community_post_votes',
    'orders',
    'user_coupons',
    'profiles'
  )
order by c.relname;


-- ------------------------------------------------------------
-- 7. 수동 판단이 필요한 항목 메모
-- ------------------------------------------------------------
-- - public.users 와 public.profiles 역할 중복 여부
-- - food_items.id(integer) vs food_media.food_id/order_items.food_id(bigint) 타입 통일 필요성
-- - recruitment_posts.category, coupons.discount_type, profiles.user_type/service_track/cadre_category 체크 제약 강화 필요성
