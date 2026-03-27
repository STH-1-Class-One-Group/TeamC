# 팀 공유 문서: 프로필/회원 유형/대시보드 작업 정리

작성일: 2026-03-27  
최종 업데이트: 2026-03-28  
대상: 프론트엔드/백엔드 팀원 전체  
범위: 회원가입 프로필, 마이페이지, 회원 유형 분기, 대시보드 복무 계산, 예비군 지도, 정책 페이지 정리, 후속 공통 작업(브랜딩/커뮤니티 조회수 및 추천 기능)

## 1. 이번에 정리한 작업 범위

이번 작업은 아래 흐름을 기준으로 진행했습니다.

- 소셜 로그인 후 `profiles` 테이블 기반의 서비스 프로필 관리
- 기존 로그인 유저도 프로필이 미완성이면 강제로 설정 모달 노출
- 마이페이지에서 프로필 수정 가능하도록 구현
- 회원 유형을 `일반인 / 현역군인(병) / 현역간부`로 분리
- 대시보드 `Discharge Calculator`를 회원 유형 기준으로 동작하도록 정리
- 대시보드에 남아 있던 영어 문구를 한국어로 교체
- 예비군 지도를 정적 JSON 기반으로 단순화하고 중복 훈련장 병합
- 프로필에서 현역병 자동 계급, 일반인 지인 1명 진행률, 간부 유형별 계급/직급 분기 반영
- 마이페이지에 회원탈퇴 위험 구역과 확인 모달 추가
- 대시보드 전역 계산기 진행률을 실시간(now 기반) 표시로 조정 중
- 신규 회원 프로필 저장 직후 가입 완료 메시지 모달 추가
- 푸터 정책 페이지(`Terms / Privacy / Support`) 추가
- 정책/고객지원 페이지를 실제 서비스 문서처럼 정리
- 헤더 로고/파비콘 브랜딩 교체
- 커뮤니티 게시글 상세 조회수 2회 증가 문제 수정
- 커뮤니티 게시글 추천/비추천 기능 추가

## 2. 커밋 단위 요약

- `87f8a8e` `feat: require profile setup for service dates`
  - `profiles`에 입대일 저장
  - 기존 유저도 프로필 설정이 안 끝났으면 강제 설정
  - 대시보드에서 입대일 기반 전역 계산 연결

- `f05e9e7` `feat: add editable my page for profiles`
  - 헤더 프로필 드롭다운에 `마이페이지` 추가
  - `/MyPage`에서 프로필 수정 가능

- `fa511fd` `feat: split civilian and active service profiles`
  - `일반인 / 현역 군인` 1차 분리

- `7f1bc48` `feat: model profile flows by user role`
  - `일반인 / 현역군인(병) / 현역간부` 3분리
  - 회원 유형별 규칙을 OOP 형태로 정리

- `f3a57a6` `fix: localize dashboard copy to korean`
  - 대시보드/식단 팝업 영어 문구를 한국어로 변경

- `a0c8eb7` `fix: update footer brand copy`
  - 푸터 저작권 문구를 템플릿 기본값에서 실제 서비스명 `짬밥요리사`로 교체
  - 연도는 하드코딩 대신 `new Date().getFullYear()` 기준으로 자동 반영

- `50de192` `feat: simplify armed reserve map data`
  - 예비군 페이지를 런타임 지오코딩 대신 좌표 포함 정적 JSON 기반으로 변경
  - `trainingCenters.generated.json` 생성 스크립트 추가

- `1fc2390` `fix: split reserve card preview and detail actions`
  - 예비군 카드 본문 클릭과 `상세보기` 버튼 동작 분리
  - 카드 본문 클릭은 지도 포커스, `상세보기`는 모달만 열리도록 수정

- `b199b0a` `feat: improve reserve map initial view and search`
  - 예비군 초기 진입 시 기본 지도 노출
  - 시/도 미선택 상태 지원
  - 검색을 지역 선택과 무관한 전체 검색으로 변경

- `d8866d6` `feat: polish legal and support pages`
  - 이용약관 / 개인정보처리방침 / 고객지원 페이지 문구 정리
  - 정책 페이지의 준비용 문구와 보조 사이드바 제거

- `77ae16d` `feat: add SEO meta tags, sitemap, and per-page Helmet`
  - 퍼블릭 메타태그, sitemap, robots, Helmet 기반 페이지별 SEO 추가

- `91a33ac` `docs: add SEO section to team onboarding document`
  - 팀 공유 문서에 SEO 작업 내역 추가

- `e53fac7` `feat: add derived service profiles and acquaintance timeline`
  - 현역병 자동 계급 계산
  - 현역간부 유형별 계급/직급 선택지 분리
  - 일반인 회원의 지인 1명 기준 진행률 반영

- `8ed9afe` `chore: archive planning docs and ignore local files`
  - 초기 기획/작업 지시 문서를 `docs/archive`로 이동
  - 로컬 개인 설정/실험 파일 ignore 추가

- `6619c4e` `feat: split profile viewing and editing`
  - 마이페이지를 조회 전용 실사용 정보 카드 구조로 재구성
  - 개인정보 수정은 별도 모달(`ProfileEditModal`)로 분리
  - 마이페이지를 조회 전용 정보 카드 구조로 재구성
  - 개인정보 수정은 별도 모달(`ProfileEditModal`)로 분리

- `ed31715` `feat: add verified account deletion flow`
  - 마이페이지에 회원탈퇴 위험 구역과 확인 모달 추가
  - 확인 문구 입력 후 회원탈퇴가 진행되도록 검증 단계 추가
  - 백엔드에 계정 삭제 API와 사용자 데이터 정리 로직 추가

## 3. 후속 공통 작업 반영 사항

이번 문서는 원래 프로필/대시보드 중심으로 정리했지만, 같은 작업 흐름 안에서 아래 공통 변경도 같이 반영했습니다.

### 환경 변수/백엔드 연결 안정화

- 백엔드에서 `SUPABASE_URL`이 비어 있어도 `DATABASE_URL` 기준으로 자동 추론되도록 보강
- 프론트 `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`는 `trim()` 처리
- 이 수정으로 `.env` 공백/누락에 덜 민감하게 동작하도록 정리

관련 파일:

- `backend/app/core/config.py`
- `frontend/src/api/supabaseClient.ts`

### 푸터 정책 페이지 추가

- 푸터의 더미 링크를 실제 라우트로 교체
- `/terms`, `/privacy`, `/support` 페이지 추가
- 로그인 모달의 이용약관/개인정보처리방침 링크도 실제 페이지로 연결
- 푸터 저작권 표기를 `© {currentYear} 짬밥요리사`로 정리해 템플릿 기본 문구 제거

관련 파일:

- `frontend/src/App.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/components/common/LoginModal.tsx`
- `frontend/src/features/legal/LegalDocumentPage.tsx`
- `frontend/src/features/legal/TermsOfServicePage.tsx`
- `frontend/src/features/legal/PrivacyPolicyPage.tsx`
- `frontend/src/features/legal/SupportPage.tsx`

### 회원가입 완료 메시지 모달 추가

- 신규 회원이 프로필 설정을 저장해 가입 흐름이 끝나면 확인 모달을 1회 노출
- 메시지는 아래 2줄로 표시
  - `Thank you for your hard work.`
  - `당신의 노고에 감사합니다.`
- 기존 회원이 마이페이지에서 프로필을 수정하는 경우에는 노출하지 않음

관련 파일:

- `frontend/src/components/common/SignupCompletionModal.tsx`
- `frontend/src/App.tsx`

### 브랜딩 자산 교체

- 헤더 로고를 새 `logo.png`로 교체
- 파비콘 소스를 새 `thumbnail.png` 기준으로 유지
- 최종 상태는 “원본 비율 유지 + 헤더 기본 높이(`h-12`)” 기준으로 복원

관련 파일:

- `frontend/public/logo.png`
- `frontend/public/thumbnail.png`
- `frontend/src/components/layout/Header.tsx`

### 커뮤니티 조회수 2회 증가 문제 수정

원인:

- React 개발 모드 `StrictMode`에서 상세 페이지 `useEffect`가 2회 실행
- 기존에는 `GET /community/posts/{post_id}`가 상세 조회와 조회수 증가를 같이 처리

수정:

- 상세 `GET`은 순수 조회로 변경
- `POST /community/posts/{post_id}/views`를 별도 분리
- 프론트 상세 화면에서 짧은 TTL 기반 중복 방지 로직 추가

관련 파일:

- `backend/app/api/v1/community.py`
- `frontend/src/features/community/PostDetailPage.tsx`

### 커뮤니티 추천/비추천 기능 추가

구현 방향:

- 같은 버튼을 두 번째 클릭하면 취소
- `추천 -> 비추천` 또는 `비추천 -> 추천`은 즉시 전환
- 상세 화면과 목록 화면 모두 집계 표시

DB 구조:

- `community_posts.upvotes`
- `community_posts.downvotes`
- `community_post_votes`
- `set_post_vote(p_post_id, p_vote_type)` RPC

관련 파일:

- `backend/app/api/v1/community.py`
- `backend/app/services/community_service.py`
- `backend/app/schemas/community_schema.py`
- `backend/sql/community_schema.sql`
- `backend/sql/community_votes_patch.sql`
- `frontend/src/features/community/types.ts`
- `frontend/src/features/community/CommunityPage.tsx`
- `frontend/src/features/community/PostDetailPage.tsx`
- `frontend/src/features/community/components/PostCard.tsx`

검증:

- 같은 추천 버튼 2회 클릭 시 `추천 -> 취소`
- 이후 `비추천` 클릭 시 `비추천 1`로 전환되는 DB 함수 동작 확인
- 현재 작업 환경의 Supabase DB에는 `community_votes_patch.sql` 적용 완료

## 4. 현재 구조

### 프로필 데이터

현재 `profiles`에서 사용하는 핵심 필드는 아래와 같습니다.

- `nickname`
- `user_type`
- `cadre_category`
- `rank`
- `unit`
- `enlistment_date`
- `service_track`
- `acquaintance_name`
- `acquaintance_service_track`
- `acquaintance_enlistment_date`
- `profile_completed`
- `avatar_url`

관련 타입:
- `frontend/src/features/profile/types.ts`

### 회원 유형 규칙 분리

회원 유형별 검증/정규화/완료 판정은 OOP로 분리했습니다.

- `frontend/src/features/profile/profileModes.ts`

구성:

- `CivilianMode`
  - 일반인
  - 닉네임만 핵심 필수값
  - 선택적으로 지인 1명의 현역병 복무 정보 입력 가능

- `ActiveEnlistedMode`
  - 현역군인(병)
  - `service_track`, `enlistment_date` 필수
  - 계급은 받지 않음
  - 계급/아바타는 입대일 기준 자동 계산

- `ActiveCadreMode`
  - 현역간부
  - `cadre_category`, `rank`, `enlistment_date` 필수
  - `service_track`은 받지 않음
  - 간부 유형에 따라 계급/직급 선택지를 다르게 노출

이 방식으로 UI 파일 안에서 `if/else`가 계속 길어지는 문제를 줄였습니다.

### 표시용 계급/아바타 규칙

- 현역병(육군/공군) 계급은 `입대일 + 복무기간 경과` 기준으로 자동 계산
  - `이병 → 일병 → 상병 → 병장`
- 현역병은 DB의 `rank` 값을 저장하지 않고 화면 계산값만 사용
- 사회복무요원/산업기능요원은 진행률만 계산하고 군 계급 이미지는 사용하지 않음
- 헤더/마이페이지/대시보드/아바타는 공통 helper를 사용해 동일한 계급 표시 규칙 적용

### 대시보드 계산 규칙

대시보드 계산용 정책은 아래 파일에 있습니다.

- `frontend/src/utils/serviceDates.ts`

현재 동작:

- 일반인
  - 지인 정보가 없으면 진행률 미적용
  - 지인 1명의 현역병 정보를 입력하면 그 지인 기준 진행률 표시

- 현역군인(병)
  - 복무 유형별 개월 수 기준으로 전역 계산
  - 예: 육군 18개월, 공군 21개월
  - 육군/공군은 자동 계급 계산 및 계급 이미지 반영
  - 사회복무요원/산업기능요원은 진행률만 계산하고 군 계급 이미지는 사용하지 않음

- 현역간부
  - 고정 의무복무기간으로 자동 전역 계산하지 않음
  - 대시보드에서는 `별도 관리`, `수동 관리`로 표시
  - 장교/부사관/군무원에 따라 계급/직급 선택지 분리

## 5. 화면별 변경 내용

### 회원가입/프로필 설정 모달

파일:
- `frontend/src/components/common/ProfileSetupModal.tsx`

변경 내용:

- 회원 유형 선택 UI 추가
- 회원 유형에 따라 입력 필드 분기
- 저장 전 검증을 `profileModes.ts` 규칙으로 처리
- 기존 프로필이 있어도 `upsert`로 갱신 가능
- 현역병은 계급 입력 UI 제거, 자동 계급 미리보기 표시
- 일반인은 지인 1명의 복무 정보를 입력 가능
- 간부는 유형별 계급/직급 선택지 분기

### 마이페이지

파일:
- `frontend/src/features/profile/MyPage.tsx`
- `frontend/src/features/profile/ProfileEditModal.tsx`
- `frontend/src/features/profile/DeleteAccountModal.tsx`
- `frontend/src/features/profile/accountApi.ts`

변경 내용:

- 마이페이지는 조회 전용 정보 카드 구조로 변경
- `프로필 정보 / 복무 정보 / 계정 정보`만 우선 노출
- 인라인 편집 폼 제거
- `개인정보 수정` 버튼을 누르면 별도 모달(`ProfileEditModal`)에서 수정
- 위험 구역(`Danger Zone`)과 `회원 탈퇴` 버튼 추가
- 회원 탈퇴는 별도 확인 모달(`DeleteAccountModal`)에서 `회원탈퇴` 문구 입력 후 진행
- 현역병의 현재 계급을 자동 계산해 표시
- 일반인의 경우 지인 1명의 진행률을 같이 관리
- 군무원 직급은 `주사보, 주사, 주무관, 사무관, 서기관, 부이사관`으로 확장

### App 인증/프로필 로딩 및 공통 라우팅

파일:
- `frontend/src/App.tsx`

변경 내용:

- 로그인 후 `profiles` 조회
- `profileModes.ts` 기준으로 프로필 완료 여부 판정
- 프로필이 미완성이면 설정 모달 강제 노출
- 후속으로 `/terms`, `/privacy`, `/support` 라우트 추가
- 마이페이지에서 회원탈퇴 성공 시 공통 로그아웃 처리와 홈 화면 복귀 연결

### 회원탈퇴 API / 백엔드 처리

파일:
- `backend/app/api/v1/auth.py`
- `backend/app/services/account_service.py`
- `backend/app/main.py`

변경 내용:

- `POST /api/v1/auth/me/delete` API 추가
- 현재 로그인한 사용자의 access token을 검증한 뒤 삭제 처리
- 확인 문구 `회원탈퇴`가 정확히 일치해야 삭제 진행
- 사용자별 데이터 정리 대상:
  - `bookmarks_news`
  - `cart_items`
  - `user_coupons`
  - `orders`
  - `profiles`
- `profiles` 삭제 후 `community_posts`, `community_comments`, `community_post_votes`는 FK cascade로 함께 정리
- 마지막 단계에서 Supabase Auth 계정 삭제

주의:

- 실제 회원탈퇴 동작을 위해 백엔드 `.env`에 `SUPABASE_SERVICE_ROLE_KEY`가 필요
- `bookmarks_news`, `cart_items`, `user_coupons`, `orders` 테이블이 없는 환경은 스킵하도록 구현

### 대시보드

파일:
- `frontend/src/features/dashboard/DashboardPage.tsx`
- `frontend/src/features/dashboard/components/MealPopup.tsx`

변경 내용:

- 프로필 기반 복무 계산 반영
- 대시보드 영어 문구를 한국어로 교체
- 식단 팝업 영어 문구도 한국어로 교체

추가 WIP (커밋 전):

- 전역 계산기 진행률을 날짜 단위 고정값이 아니라 `now` 기준 실시간 퍼센트로 재계산
- 숫자 퍼센트는 소수점 자릿수를 크게 열어 실시간 증가폭이 보이도록 조정
- 전역 계산기 카드가 화면에 보일 때만 진행률 타이머가 동작하도록 가시성 기반 갱신 적용
- 그래프 바는 `transition`으로 부드럽게 따라오도록 조정

## 6. DB 관련

신규 테이블 전체 생성용:

- `backend/sql/community_schema.sql`

기존 Supabase 프로젝트 컬럼 추가용:

- `backend/sql/profile_enlistment_date_patch.sql`
- `backend/sql/community_votes_patch.sql`

현재 패치 SQL에서 추가하는 핵심 컬럼:

- `user_type`
- `cadre_category`
- `enlistment_date`
- `service_track`
- `acquaintance_name`
- `acquaintance_service_track`
- `acquaintance_enlistment_date`
- `profile_completed`
- `upvotes`
- `downvotes`

주의:

- 기존 프로젝트는 `profile_enlistment_date_patch.sql` 실행이 필요합니다.
- 지인 진행률 기능을 쓰려면 이 패치를 다시 실행해 `acquaintance_*` 컬럼까지 반영해야 합니다.
- 이 패치 SQL은 현재 `컬럼 추가` 중심입니다.
- 강한 `constraint`를 추가하는 보강 SQL은 아직 별도 분리하지 않았습니다.
- 추천/비추천 기능을 쓰려면 `community_votes_patch.sql`도 같이 실행해야 합니다.
- 이 패치는 `community_post_votes` 테이블과 `set_post_vote()` RPC를 추가합니다.

## 7. 테스트/검증

프론트 기준으로 아래를 반복 확인했습니다.

- `npm run build`

결과:

- 빌드 통과
- 기존 ESLint 경고는 유지

남아 있는 기존 경고:

- `frontend/src/features/community/components/CommentSection.tsx`
- `frontend/src/features/meal/MealPage.tsx`

이번 작업에서 새로 생긴 빌드 오류는 정리 완료했습니다.

추가 확인 완료:

- 커뮤니티 추천/비추천 토글 SQL 동작 확인
- 목록 API에 `upvotes/downvotes/viewer_vote` 필드가 내려오는 것 확인
- 조회수 분리 이후 상세 진입 시 중복 증가 경로 제거 확인
- 회원탈퇴 추가 후 백엔드 `python -m compileall backend/app` 통과
- 회원탈퇴 추가 후 프론트 `npm run build` 통과 (기존 ESLint 경고만 유지)

## 8. 팀원이 이어서 보기 좋은 포인트

### 프론트엔드

- 회원 유형이 더 늘어나면 `profileModes.ts`에 새 클래스를 추가하는 방식으로 확장 가능
- 대시보드에서 간부용 별도 카드/표현이 필요하면 `serviceDates.ts`에서 표시 정책 분리 가능
- 마이페이지는 조회와 수정을 분리했기 때문에, 이후에는 `ProfileEditModal`만 확장하면 됨
- 실사용 관점에서 민감 정보/입력 폼을 메인 마이페이지에 그대로 노출하지 않는 구조로 전환
- 현역병 자동 계급 기준(2/6/6개월)을 바꿔야 하면 `serviceDates.ts`만 수정하면 됨

### 백엔드/DB

- `profiles` 컬럼에 대한 `check constraint` 보강 가능
- 간부 계정의 복무/진급/임용 체계를 더 정교하게 설계할 수 있음
- 군무원에 대해 `계급` 대신 `직급`을 필드 분리할지 검토 필요
- 회원탈퇴 시 커뮤니티 활동을 완전 삭제할지, 작성자만 익명화하고 게시글은 유지할지 정책 확정 필요
- 추천/비추천은 현재 게시글 단위만 구현되어 있으므로, 필요하면 댓글 추천까지 같은 패턴으로 확장 가능
- `viewer_vote`는 현재 상세 페이지에서 주로 사용하므로, 목록에서도 개인화 표시가 필요하면 인증 헤더 전달 로직을 추가 검토

## 9. 예비군(Armed Reserve) 페이지 신규 구현

### 개요

- 예비군 홈페이지(yebigun1.mil.kr)에서 전국 **286개 훈련장** 실데이터를 수집
- 앱 런타임에서는 좌표 포함 정적 JSON만 사용
- 중복/관할 중첩 데이터를 병합해 현재 **153개 유니크 훈련장** 기준으로 사용
- `react-kakao-maps-sdk` 라이브러리 도입
- 좌표 생성은 별도 스크립트(`npm run generate:training-centers`)로 수행

### 라우트/네비게이션

- `/ArmedReserve` 라우트 추가
- Header의 "Armed Reserve" 비활성 버튼 → NavLink로 변환

### 주요 기능

- 시/도 드롭다운 필터 (17개 시/도)
- 초기 진입 시 시/도 미선택 + 기본 카카오맵 표시
- 검색창은 시/도 선택과 무관하게 전체 훈련장 검색
- 지역 선택 시 해당 훈련장만 지도에 마커 표시 + 자동 영역 맞춤
- 훈련장 카드: 이름, 상태, 주소, 전화번호, 통합 관할 지역 표시
- 카드 본문 클릭: 지도 포커스
- `상세보기` 버튼 클릭: 상세 모달만 열기
- "상세보기", "신청하기" 버튼은 UI만 (추후 구현)
- 북마크 기능은 팀원 별도 구현 후 연동 예정
- 카카오맵 키 미설정 시 placeholder UI 표시
- 빈 상태에서도 지도는 유지하고 안내 문구만 오버레이로 표시

### 환경 변수

- `REACT_APP_KAKAO_MAP_KEY`: 카카오 디벨로퍼스에서 JavaScript 키 발급 필요
- 카카오 디벨로퍼스 > 앱 설정 > 플랫폼 > Web에 `http://localhost:3000` 등록 필요
- 카카오 디벨로퍼스 > 앱 설정 > 카카오맵 > 사용 설정 ON 필요 (2024.12부터 필수)

### 신규 패키지

- `react-kakao-maps-sdk`: 카카오맵 React 컴포넌트 라이브러리
- `kakao.maps.d.ts`: 카카오맵 TypeScript 타입 정의

### 관련 파일

신규:
- `frontend/src/features/reservation/ArmedReservePage.tsx` — 메인 페이지
- `frontend/src/features/reservation/components/KakaoMap.tsx` — 카카오맵 컴포넌트
- `frontend/src/features/reservation/components/TrainingCenterCard.tsx` — 훈련소 카드
- `frontend/src/features/reservation/components/TrainingCenterList.tsx` — 훈련소 리스트
- `frontend/src/features/reservation/data/trainingCenters.ts` — 타입 정의 + 실제 앱 진입점
- `frontend/src/features/reservation/data/trainingCentersRaw.json` — 원본 JSON 데이터
- `frontend/src/features/reservation/data/trainingCenters.generated.json` — 좌표 포함/중복 병합 완료 JSON
- `frontend/scripts/generate-training-centers.mjs` — 좌표 생성/병합 스크립트

수정:
- `frontend/src/App.tsx` — `/ArmedReserve` 라우트 추가
- `frontend/src/components/layout/Header.tsx` — Armed Reserve NavLink 변환

### 데이터 출처

- 예비군 홈페이지 훈련장 안내 API: `https://www.yebigun1.mil.kr/dmobis/popup/RfTraCenterGuidListPopupAjax.do`
- POST 요청, `start=0&length=300&draw=1` 파라미터로 전체 286개 조회
- 각 훈련장: id(uuid), 이름, 시/도, 구/군, 주소, 전화번호 포함
- 좌표는 원본 API에 없어서 생성 스크립트에서 Kakao Local API를 사용해 사전 생성
- 앱 런타임에서는 지오코딩을 하지 않음

## 10. 현재 워킹트리 상태

현재 확인된 미커밋 상태는 아래와 같습니다.

- 수정 중: `docs/team-share-profile-dashboard-2026-03-27.md`
- 수정 중: `frontend/src/features/dashboard/DashboardPage.tsx`
- 수정 중: `frontend/src/utils/serviceDates.ts`
- 미추적: `backend/sql/supabase_best_practices_patch.sql`
- 미추적: `backend/sql/supabase_best_practices_preflight.sql`
- 미추적: `frontend/src/components/common/SignupCompletionModal.tsx`
- 미추적: `frontend/public/Gemini_Generated_Image_m48tqbm48tqbm48t 1.png`
- 미추적: `frontend/public/Whisk_a4132e013c3d79981b846046fbe4a897dr 1.png`

## 11. 팀원 액션 아이템

- 기존 Supabase 프로젝트라면 `backend/sql/profile_enlistment_date_patch.sql` 실행
- 커뮤니티 추천/비추천을 쓸 환경이면 `backend/sql/community_votes_patch.sql`도 실행
- 프론트 pull 후 로그인/프로필 설정/마이페이지/대시보드 흐름 확인
- 회원탈퇴 기능을 실제로 쓸 환경이면 백엔드 `.env`에 `SUPABASE_SERVICE_ROLE_KEY` 설정 확인
- 푸터 정책 페이지(`/terms`, `/privacy`, `/support`) 문구를 실제 운영 정책 기준으로 최종 검토
- 커뮤니티 상세 페이지에서 추천/비추천 토글 동작 확인
- 간부 계정의 장기 복무/정년/진급 로직을 더 넣을지 논의
- 필요 시 DB constraint 보강용 SQL 추가
- 일반인 지인 진행률을 다인 모델로 확장할지 논의
- 군무원 직급 체계를 더 세분화할지 논의
- 대시보드 실시간 진행률 표시가 현재 UX에 적절한지 확정 필요 (현재 WIP)
- 예비군 페이지 사용 시 `.env`에 `REACT_APP_KAKAO_MAP_KEY` 설정 + 카카오 디벨로퍼스 플랫폼/카카오맵 사용 설정 필요
- `npm install` 재실행 필요 (`react-kakao-maps-sdk`, `kakao.maps.d.ts` 추가됨)
- 북마크 기능 구현 후 예비군 페이지에 연동 필요
- 예비군 원본 JSON이 갱신되면 `npm run generate:training-centers` 재실행 필요
- `npm install` 재실행 필요 (`react-helmet-async` 추가됨)

## 12. SEO 적용 사항 (2026-03-28)

### 변경 파일
| 파일 | 내용 |
|------|------|
| `frontend/public/index.html` | `lang="ko"`, meta description/keywords(군인·방산·예비군), OG/Twitter 카드, canonical URL, Naver 검색 등록 placeholder |
| `frontend/public/manifest.json` | 앱명 `Modern Sentinel`, 테마 색상 `#0061a5` |
| `frontend/public/robots.txt` | sitemap 연결, `/payment-success` disallow |
| `frontend/public/sitemap.xml` | 전체 공개 라우트 9개 등록 (우선순위 포함) |
| `frontend/src/index.tsx` | `HelmetProvider` 래핑 |

### 페이지별 Helmet 메타 태그
| 페이지 | title | 타겟 키워드 |
|--------|-------|-------------|
| Shop (메인) | Modern Sentinel — 군인을 위한 스마트 플랫폼 | 군인, 방산, 국방 |
| ArmedReserve | 예비군 훈련장 찾기 | 예비군, 훈련장 |
| News | 방산 뉴스 | 방산, 국방 뉴스 |
| Meal | 군 급식 정보 | 군 급식, 군인 식단 |
| Community | 군인 커뮤니티 | 군인 커뮤니티 |

### 팀원 참고
- 새 페이지 추가 시 `<Helmet>`으로 title/description 설정 필요 (`react-helmet-async` 사용)
- `sitemap.xml`에 새 라우트 추가 필요
- 배포 도메인 확정 후 `index.html`의 `og:image` URL과 `canonical` URL 업데이트 필요
- 네이버 서치어드바이저 등록 시 `naver-site-verification` meta 값 채워야 함
- 구글 서치콘솔 등록도 별도 진행 필요
