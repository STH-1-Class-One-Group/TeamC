-- ============================================================
-- Modern Sentinel - profiles.enlistment_date patch
-- 기존 public.profiles 테이블에 입대일 컬럼을 추가합니다.
-- Supabase SQL Editor에서 1회 실행하세요.
-- ============================================================

alter table public.profiles
  add column if not exists enlistment_date date;

comment on column public.profiles.enlistment_date is '입대일 (군 복무 중인 사용자용, 선택)';

alter table public.profiles
  add column if not exists profile_completed boolean not null default false;

comment on column public.profiles.profile_completed is '프로필 설정 완료 여부';
