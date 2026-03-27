# 팀 공유 문서: 프로필/회원 유형/대시보드 작업 정리

작성일: 2026-03-27  
대상: 프론트엔드/백엔드 팀원 전체  
범위: 회원가입 프로필, 마이페이지, 회원 유형 분기, 대시보드 복무 계산, 대시보드 한글화, 후속 공통 작업(정책 페이지/브랜딩/커뮤니티 조회수 및 추천 기능)

## 1. 이번에 정리한 작업 범위

이번 작업은 아래 흐름을 기준으로 진행했습니다.

- 소셜 로그인 후 `profiles` 테이블 기반의 서비스 프로필 관리
- 기존 로그인 유저도 프로필이 미완성이면 강제로 설정 모달 노출
- 마이페이지에서 프로필 수정 가능하도록 구현
- 회원 유형을 `일반인 / 현역군인(병) / 현역간부`로 분리
- 대시보드 `Discharge Calculator`를 회원 유형 기준으로 동작하도록 정리
- 대시보드에 남아 있던 영어 문구를 한국어로 교체
- 푸터 정책 페이지(`Terms / Privacy / Support`) 추가
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

관련 파일:

- `frontend/src/App.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/components/common/LoginModal.tsx`
- `frontend/src/features/legal/LegalDocumentPage.tsx`
- `frontend/src/features/legal/TermsOfServicePage.tsx`
- `frontend/src/features/legal/PrivacyPolicyPage.tsx`
- `frontend/src/features/legal/SupportPage.tsx`

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

- `ActiveEnlistedMode`
  - 현역군인(병)
  - `service_track`, `enlistment_date` 필수
  - 계급은 받지 않음

- `ActiveCadreMode`
  - 현역간부
  - `cadre_category`, `rank`, `enlistment_date` 필수
  - `service_track`은 받지 않음

이 방식으로 UI 파일 안에서 `if/else`가 계속 길어지는 문제를 줄였습니다.

### 대시보드 계산 규칙

대시보드 계산용 정책은 아래 파일에 있습니다.

- `frontend/src/utils/serviceDates.ts`

현재 동작:

- 일반인
  - 복무 계산 미적용
  - 대시보드에서는 `해당 없음`

- 현역군인(병)
  - 복무 유형별 개월 수 기준으로 전역 계산
  - 예: 육군 18개월, 공군 21개월

- 현역간부
  - 고정 의무복무기간으로 자동 전역 계산하지 않음
  - 대시보드에서는 `별도 관리`, `수동 관리`로 표시

## 5. 화면별 변경 내용

### 회원가입/프로필 설정 모달

파일:
- `frontend/src/components/common/ProfileSetupModal.tsx`

변경 내용:

- 회원 유형 선택 UI 추가
- 회원 유형에 따라 입력 필드 분기
- 저장 전 검증을 `profileModes.ts` 규칙으로 처리
- 기존 프로필이 있어도 `upsert`로 갱신 가능

### 마이페이지

파일:
- `frontend/src/features/profile/MyPage.tsx`

변경 내용:

- 현재 유저 프로필 정보 확인
- 회원 유형 변경 가능
- 회원 유형에 따라 입력 필드 자동 변경
- 저장 후 App 상태 즉시 갱신
- 대시보드 반영 값과 연결

### App 인증/프로필 로딩 및 공통 라우팅

파일:
- `frontend/src/App.tsx`

변경 내용:

- 로그인 후 `profiles` 조회
- `profileModes.ts` 기준으로 프로필 완료 여부 판정
- 프로필이 미완성이면 설정 모달 강제 노출
- 후속으로 `/terms`, `/privacy`, `/support` 라우트 추가

### 대시보드

파일:
- `frontend/src/features/dashboard/DashboardPage.tsx`
- `frontend/src/features/dashboard/components/MealPopup.tsx`

변경 내용:

- 프로필 기반 복무 계산 반영
- 대시보드 영어 문구를 한국어로 교체
- 식단 팝업 영어 문구도 한국어로 교체

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
- `profile_completed`
- `upvotes`
- `downvotes`

주의:

- 기존 프로젝트는 `profile_enlistment_date_patch.sql` 실행이 필요합니다.
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

- `frontend/src/components/layout/Header.tsx`
- `frontend/src/features/community/components/CommentSection.tsx`
- `frontend/src/features/meal/MealPage.tsx`

이번 작업에서 새로 생긴 빌드 오류는 정리 완료했습니다.

추가 확인 완료:

- 커뮤니티 추천/비추천 토글 SQL 동작 확인
- 목록 API에 `upvotes/downvotes/viewer_vote` 필드가 내려오는 것 확인
- 조회수 분리 이후 상세 진입 시 중복 증가 경로 제거 확인

## 8. 팀원이 이어서 보기 좋은 포인트

### 프론트엔드

- 회원 유형이 더 늘어나면 `profileModes.ts`에 새 클래스를 추가하는 방식으로 확장 가능
- 대시보드에서 간부용 별도 카드/표현이 필요하면 `serviceDates.ts`에서 표시 정책 분리 가능
- 마이페이지 UI는 현재 기능 위주라서 시각적으로 더 다듬을 여지가 있음

### 백엔드/DB

- `profiles` 컬럼에 대한 `check constraint` 보강 가능
- 간부 계정의 복무/진급/임용 체계를 더 정교하게 설계할 수 있음
- 군무원에 대해 `계급` 대신 `직급`을 필드 분리할지 검토 필요
- 추천/비추천은 현재 게시글 단위만 구현되어 있으므로, 필요하면 댓글 추천까지 같은 패턴으로 확장 가능
- `viewer_vote`는 현재 상세 페이지에서 주로 사용하므로, 목록에서도 개인화 표시가 필요하면 인증 헤더 전달 로직을 추가 검토

## 9. 현재 워킹트리 상태

이 문서 작성 시점 기준으로, 아래는 아직 커밋되지 않은 다른 작업입니다.

- `frontend/src/App.tsx`
- `frontend/src/components/layout/Header.tsx`
- `frontend/public/Gemini_Generated_Image_m48tqbm48tqbm48t 1.png`
- `frontend/public/Whisk_a4132e013c3d79981b846046fbe4a897dr 1.png`
- `frontend/src/features/reservation/ArmedReservePage.tsx`
- `frontend/src/features/reservation/components/`
- `frontend/src/features/reservation/data/`

즉, 이 문서에 적은 프로필/대시보드/정책 페이지/커뮤니티 후속 작업은 구조상 반영되어 있으나,
위 파일들은 아직 추가 정리나 커밋 분리가 더 필요할 수 있습니다.

## 10. 팀원 액션 아이템

- 기존 Supabase 프로젝트라면 `backend/sql/profile_enlistment_date_patch.sql` 실행
- 커뮤니티 추천/비추천을 쓸 환경이면 `backend/sql/community_votes_patch.sql`도 실행
- 프론트 pull 후 로그인/프로필 설정/마이페이지/대시보드 흐름 확인
- 푸터 정책 페이지(`/terms`, `/privacy`, `/support`) 문구를 실제 운영 정책 기준으로 최종 검토
- 커뮤니티 상세 페이지에서 추천/비추천 토글 동작 확인
- 간부 계정의 장기 복무/정년/진급 로직을 더 넣을지 논의
- 필요 시 DB constraint 보강용 SQL 추가
