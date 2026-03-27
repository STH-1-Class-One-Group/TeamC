# 팀 공유 문서: 프로필/회원 유형/대시보드 작업 정리

작성일: 2026-03-27  
최종 업데이트: 2026-03-28  
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

- `a0c8eb7` `fix: update footer brand copy`
  - 푸터 저작권 문구를 템플릿 기본값에서 실제 서비스명 `짬밥요리사`로 교체
  - 연도는 하드코딩 대신 `new Date().getFullYear()` 기준으로 자동 반영

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

## 9. 예비군(Armed Reserve) 페이지 신규 구현

### 개요

- 예비군 홈페이지(yebigun1.mil.kr)에서 전국 **286개 훈련장** 실데이터를 수집
- 카카오맵 연동으로 시/도별 훈련장 위치를 지도에 표시
- `react-kakao-maps-sdk` 라이브러리 도입
- 카카오 Geocoding API로 주소 → 좌표 자동 변환

### 라우트/네비게이션

- `/ArmedReserve` 라우트 추가
- Header의 "Armed Reserve" 비활성 버튼 → NavLink로 변환

### 주요 기능

- 시/도 드롭다운 필터 (17개 시/도)
- 지역 선택 시 해당 훈련장만 지도에 마커 표시 + 자동 영역 맞춤
- 훈련장 카드: 이름, 상태, 주소, 전화번호 표시
- "상세보기", "신청하기" 버튼은 UI만 (추후 구현)
- 북마크 기능은 팀원 별도 구현 후 연동 예정
- 카카오맵 키 미설정 시 placeholder UI 표시
- 로딩/빈 결과 상태 UI 포함

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
- `frontend/src/features/reservation/data/trainingCenters.ts` — 타입 정의 + 286개 훈련장 데이터
- `frontend/src/features/reservation/data/trainingCentersRaw.json` — 원본 JSON 데이터

수정:
- `frontend/src/App.tsx` — `/ArmedReserve` 라우트 추가
- `frontend/src/components/layout/Header.tsx` — Armed Reserve NavLink 변환

### 데이터 출처

- 예비군 홈페이지 훈련장 안내 API: `https://www.yebigun1.mil.kr/dmobis/popup/RfTraCenterGuidListPopupAjax.do`
- POST 요청, `start=0&length=300&draw=1` 파라미터로 전체 286개 조회
- 각 훈련장: id(uuid), 이름, 시/도, 구/군, 주소, 전화번호 포함
- 좌표는 포함되지 않아 카카오 Geocoding API로 런타임 변환

## 10. 현재 워킹트리 상태

현재 확인된 미커밋 상태는 아래와 같습니다.

- 수정 중: `frontend/src/features/reservation/ArmedReservePage.tsx`
- 수정 중: `frontend/src/features/reservation/components/KakaoMap.tsx`
- 미추적: `.claude/`
- 미추적: `backend/sql/supabase_best_practices_patch.sql`
- 미추적: `backend/sql/supabase_best_practices_preflight.sql`
- 미추적: `frontend/public/Gemini_Generated_Image_m48tqbm48tqbm48t 1.png`
- 미추적: `frontend/public/Whisk_a4132e013c3d79981b846046fbe4a897dr 1.png`
- 미추적: `yebigun_test.bin`

## 11. 팀원 액션 아이템

- 기존 Supabase 프로젝트라면 `backend/sql/profile_enlistment_date_patch.sql` 실행
- 커뮤니티 추천/비추천을 쓸 환경이면 `backend/sql/community_votes_patch.sql`도 실행
- 프론트 pull 후 로그인/프로필 설정/마이페이지/대시보드 흐름 확인
- 푸터 정책 페이지(`/terms`, `/privacy`, `/support`) 문구를 실제 운영 정책 기준으로 최종 검토
- 커뮤니티 상세 페이지에서 추천/비추천 토글 동작 확인
- 간부 계정의 장기 복무/정년/진급 로직을 더 넣을지 논의
- 필요 시 DB constraint 보강용 SQL 추가
- 예비군 페이지 사용 시 `.env`에 `REACT_APP_KAKAO_MAP_KEY` 설정 + 카카오 디벨로퍼스 플랫폼/카카오맵 사용 설정 필요
- `npm install` 재실행 필요 (`react-kakao-maps-sdk`, `kakao.maps.d.ts` 추가됨)
- 북마크 기능 구현 후 예비군 페이지에 연동 필요
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
