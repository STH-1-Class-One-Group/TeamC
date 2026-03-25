-- ============================================================
-- Modern Sentinel - Profile rank avatar backfill
-- 기존 profiles.avatar_url 값을 계급별 기본 이미지 경로로 일괄 정리합니다.
-- Supabase Storage bucket: profile-images
-- 파일명 규칙: 0.png~18.png / default.png
-- ============================================================

update public.profiles
set avatar_url = case
  when btrim(rank) = '이병' then '0.png'
  when btrim(rank) = '일병' then '1.png'
  when btrim(rank) = '상병' then '2.png'
  when btrim(rank) = '병장' then '3.png'
  when btrim(rank) = '하사' then '4.png'
  when btrim(rank) = '중사' then '5.png'
  when btrim(rank) = '상사' then '6.png'
  when btrim(rank) = '원사' then '7.png'
  when btrim(rank) = '준위' then '8.png'
  when btrim(rank) = '소위' then '9.png'
  when btrim(rank) = '중위' then '10.png'
  when btrim(rank) = '대위' then '11.png'
  when btrim(rank) = '소령' then '12.png'
  when btrim(rank) = '중령' then '13.png'
  when btrim(rank) = '대령' then '14.png'
  when btrim(rank) = '준장' then '15.png'
  when btrim(rank) = '소장' then '16.png'
  when btrim(rank) = '중장' then '17.png'
  when btrim(rank) = '대장' then '18.png'
  else 'default.png'
end
where avatar_url is distinct from case
  when btrim(rank) = '이병' then '0.png'
  when btrim(rank) = '일병' then '1.png'
  when btrim(rank) = '상병' then '2.png'
  when btrim(rank) = '병장' then '3.png'
  when btrim(rank) = '하사' then '4.png'
  when btrim(rank) = '중사' then '5.png'
  when btrim(rank) = '상사' then '6.png'
  when btrim(rank) = '원사' then '7.png'
  when btrim(rank) = '준위' then '8.png'
  when btrim(rank) = '소위' then '9.png'
  when btrim(rank) = '중위' then '10.png'
  when btrim(rank) = '대위' then '11.png'
  when btrim(rank) = '소령' then '12.png'
  when btrim(rank) = '중령' then '13.png'
  when btrim(rank) = '대령' then '14.png'
  when btrim(rank) = '준장' then '15.png'
  when btrim(rank) = '소장' then '16.png'
  when btrim(rank) = '중장' then '17.png'
  when btrim(rank) = '대장' then '18.png'
  else 'default.png'
end;
