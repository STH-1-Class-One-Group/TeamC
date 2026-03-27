-- ============================================================
-- Modern Sentinel - profiles.enlistment_date patch
-- 기존 public.profiles 테이블에 입대일 컬럼을 추가합니다.
-- Supabase SQL Editor에서 1회 실행하세요.
-- ============================================================

alter table public.profiles
  add column if not exists enlistment_date date;

comment on column public.profiles.enlistment_date is '입대일 (군 복무 중인 사용자용, 선택)';

alter table public.profiles
  add column if not exists user_type text;

comment on column public.profiles.user_type is '회원 유형 (civilian, active_enlisted, active_cadre)';

alter table public.profiles
  add column if not exists cadre_category text;

comment on column public.profiles.cadre_category is '현역간부 직군 (officer, nco, civilian_staff)';

alter table public.profiles
  add column if not exists service_track text;

comment on column public.profiles.service_track is '현역군인(병)의 복무 유형';

alter table public.profiles
  add column if not exists acquaintance_name text;

comment on column public.profiles.acquaintance_name is '일반인 회원이 등록한 지인 이름 (선택)';

alter table public.profiles
  add column if not exists acquaintance_service_track text;

comment on column public.profiles.acquaintance_service_track is '일반인 회원이 등록한 지인 복무 유형 (army_active, air_force_active)';

alter table public.profiles
  add column if not exists acquaintance_enlistment_date date;

comment on column public.profiles.acquaintance_enlistment_date is '일반인 회원이 등록한 지인 입대일 (선택)';

alter table public.profiles
  add column if not exists profile_completed boolean not null default false;

comment on column public.profiles.profile_completed is '프로필 설정 완료 여부';
