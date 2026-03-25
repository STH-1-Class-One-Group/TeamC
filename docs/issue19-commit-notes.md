# Issue19 Commit Notes

`komong/issue19` 브랜치에서 커뮤니티 기능을 붙이면서 나온 주요 커밋을 팀원용으로 정리한 문서입니다.

## 읽는 법

- `무엇을 했는가`: 커밋의 핵심 목적
- `왜 필요한가`: 이전 상태에서 어떤 문제가 있었는지
- `핵심 변경`: 코드 레벨에서 실제로 바뀐 것
- `팀원이 알아야 할 점`: 협업 시 놓치기 쉬운 주의사항

---

## `c4d81b0` `feat: use rank-based profile avatars`

### 무엇을 했는가
- 구글 OAuth 프로필 사진 대신 계급별 기본 프로필 이미지를 사용하도록 규칙을 바꿨습니다.

### 왜 필요한가
- 현재 `profiles.avatar_url`에 구글 프로필 URL이 저장되어 있어 서비스 내 세계관/브랜딩과 맞지 않았습니다.
- 계급을 이미 입력받고 있으므로 그 값을 기본 프로필 이미지에 직접 반영할 수 있습니다.

### 핵심 변경
- 프론트 공통 프로필 아바타 렌더링 헬퍼/컴포넌트 추가
- 신규 가입 시 `avatar_url`에 rank별 숫자 파일명 또는 `default.png` 저장
- 헤더/게시글 상세/댓글에서 모두 같은 계급 이미지 규칙 사용
- `준위` 계급 추가
- `backend/sql/profile_rank_avatar_backfill.sql`
  - 기존 유저의 `profiles.avatar_url`를 숫자 파일명 규칙으로 일괄 갱신하는 SQL 추가

### 팀원이 알아야 할 점
- `avatar_url`는 더 이상 외부 OAuth URL이 아니라 Supabase Storage 이미지 경로 의미로 사용됩니다.
- Storage 버킷은 `profile-images`, 파일명 규칙은 `0.png~18.png`, 기본 이미지는 `default.png`입니다.
- 계급 매핑은 `이병=0`, `일병=1`, `상병=2`, `병장=3`, `하사=4`, `중사=5`, `상사=6`, `원사=7`, `준위=8`, `소위=9` ... `대장=18` 기준입니다.
- 2026-03-26 기준으로 Storage 파일 업로드와 기존 유저 backfill SQL 적용까지 완료했습니다.

---

## `1c8204b` `perf: optimize community RLS policies`

### 무엇을 했는가
- 커뮤니티 RLS 정책을 Supabase 권장 성능 패턴으로 정리하는 SQL을 추가했습니다.

### 왜 필요한가
- 기존 정책은 `auth.uid() = column` 형태라 행 수가 늘어날수록 정책 평가 비용이 커질 수 있습니다.
- Supabase 가이드는 `(select auth.uid()) = column` 형태를 권장합니다.

### 핵심 변경
- `backend/sql/community_schema.sql`
  - 신규 설치 시 바로 최적화된 RLS 정책이 생성되도록 수정
- `backend/sql/community_rls_performance_patch.sql`
  - 이미 생성된 DB 정책을 drop/recreate 해서 성능 패턴으로 바꾸는 patch SQL 추가

### 팀원이 알아야 할 점
- 기존 DB는 `community_rls_performance_patch.sql`을 직접 실행해야 반영됩니다.
- 이 변경은 기능 변경이 아니라 정책 평가 성능 최적화입니다.
- 2026-03-26 기준으로 해당 SQL은 Supabase에 이미 실행 완료했습니다.

---

## `4704f83` `perf: improve community board responsiveness`

### 무엇을 했는가
- 커뮤니티 게시판의 체감 로딩 속도를 더 빠르게 만들었습니다.

### 왜 필요한가
- 이전 최적화 이후에도 목록 전환 시 화면이 다시 비는 느낌이 있었고, Supabase 호출 연결을 요청마다 새로 열고 있었습니다.
- 검색/카테고리 전환이 빨라질수록 이전 요청이 늦게 도착해 화면이 덮어써질 위험도 있었습니다.

### 핵심 변경
- `backend/app/services/community_service.py`
  - Supabase 호출용 `httpx.AsyncClient`를 재사용하도록 변경
  - `count=exact` 대신 `count=planned` 사용
- `backend/app/main.py`
  - FastAPI 종료 시 HTTP 클라이언트 정리 로직 추가
- `frontend/src/features/community/CommunityPage.tsx`
  - 이전 요청 abort 처리
  - 새 데이터가 오는 동안 기존 목록 유지
  - 전체 로딩 대신 `목록 업데이트 중...` 상태 표시
- `backend/sql/community_schema.sql`
  - 커뮤니티 테이블 인덱스 추가
- `backend/sql/community_performance_patch.sql`
  - 이미 생성된 DB에 성능 인덱스만 따로 적용할 수 있는 패치 SQL 추가

### 팀원이 알아야 할 점
- 이 커밋만으로도 체감속도는 빨라집니다.
- DB 인덱스 효과까지 받으려면 `backend/sql/community_performance_patch.sql`을 Supabase SQL Editor에서 별도로 실행해야 합니다.
- `count=planned`는 속도는 더 빠르지만 큰 규모에서는 total이 근사치일 수 있습니다.
- 2026-03-26 기준으로 `community_performance_patch.sql`도 Supabase에 이미 실행 완료했습니다.

---

## `a0a2e17` `perf: reduce community API latency`

### 무엇을 했는가
- 커뮤니티 API 자체의 왕복 비용을 줄였습니다.

### 왜 필요한가
- 게시글 목록에서 목록 조회와 전체 개수 조회를 따로 보내고 있었고, 상세 조회는 본문 응답 전에 조회수 증가까지 기다리고 있었습니다.

### 핵심 변경
- `backend/app/services/community_service.py`
  - 목록 조회를 `GET + HEAD` 두 번에서 한 번으로 축소
  - 목록 화면에서 안 쓰는 `content` 본문 제거
  - JWT의 `sub`를 바로 사용해 사용자 ID 조회용 추가 요청 축소
- `backend/app/api/v1/community.py`
  - 게시글 상세 조회 후 조회수 증가는 `BackgroundTasks`로 뒤로 미룸

### 팀원이 알아야 할 점
- 목록 화면 응답이 줄어서 첫 진입과 페이지 이동이 더 빨라졌습니다.
- 이 커밋은 DB 구조를 바꾸지 않고 API 흐름만 최적화한 것입니다.

---

## `d476390` `Implement community board listing and auth cleanup`

### 무엇을 했는가
- 커뮤니티 목록 페이지를 실제 게시판 스타일로 고도화했고, 인증/세션 정리 로직을 손봤습니다.

### 왜 필요한가
- 초기 커뮤니티 화면은 기능은 있었지만 게시판 번호, 검색, 페이지 크기, 카테고리 탭 같은 실제 사용 흐름이 부족했습니다.
- 로그아웃 시 세션이 찌꺼기처럼 남는 경우도 정리할 필요가 있었습니다.

### 핵심 변경
- `frontend/src/features/community/CommunityPage.tsx`
  - 카테고리 탭, 검색 타입, 검색어, 페이지네이션, 목록 수 선택 추가
  - 게시판 번호(`post_number`) 기준 정렬/표시
- `frontend/src/App.tsx`
  - Supabase auth storage 정리 로직 추가
  - 초기 세션/프로필 동기화 정리
- `backend/sql/community_post_number_patch.sql`
  - 기존 게시글에 게시판 번호를 부여하는 패치 SQL 추가
- `backend/app/services/community_service.py`
  - 게시글 목록 응답에 `post_number` 포함

### 팀원이 알아야 할 점
- `post_number`를 쓰려면 `community_post_number_patch.sql`도 적용돼 있어야 합니다.
- 현재 `useAuthStore.ts`를 안 쓰고, 인증 흐름은 대부분 `App.tsx`에 들어가 있습니다.

---

## `29dc8f8` `docs: DB 스키마 변경 가이드 문서 추가`

### 무엇을 했는가
- 커뮤니티 관련 DB 구조 변경 내용을 설명하는 문서를 추가했습니다.

### 왜 필요한가
- Supabase에서 어떤 SQL을 실행해야 하는지, 기존 구조와 무엇이 달라졌는지 코드만 보고 이해하기 어려웠습니다.

### 핵심 변경
- `docs/db-schema-guide.md`
  - 변경 전/후 테이블 설명
  - ERD
  - 로그인 흐름 변경 다이어그램
  - Supabase 설정 순서

### 팀원이 알아야 할 점
- DB 세팅이 헷갈리면 이 문서를 먼저 보는 것이 가장 빠릅니다.

---

## `a2506f5` `feat: 프론트엔드 커뮤니티 페이지 구현 및 라우팅 연결`

### 무엇을 했는가
- 프론트엔드 커뮤니티 화면 전체를 추가했습니다.

### 왜 필요한가
- DB와 API만 있어도 사용자가 볼 수 있는 화면이 없으면 기능을 검증할 수 없습니다.

### 핵심 변경
- `frontend/src/features/community/`
  - `CommunityPage.tsx`
  - `PostDetailPage.tsx`
  - `PostWritePage.tsx`
  - `components/CommentSection.tsx`
  - `components/PostCard.tsx`
  - `types.ts`
- `frontend/src/App.tsx`
  - `/Community`
  - `/Community/write`
  - `/Community/:postId`
  - `/Community/:postId/edit`
  라우트 연결

### 팀원이 알아야 할 점
- 게시판 UI의 기준점이 되는 커밋입니다.
- 이후 커밋들은 이 화면 위에 기능과 성능을 덧씌운 형태입니다.

---

## `fff3bab` `feat: 백엔드 커뮤니티 API 구현`

### 무엇을 했는가
- FastAPI에서 커뮤니티 게시글/댓글 API를 구현했습니다.

### 왜 필요한가
- 프론트가 Supabase를 직접 다 만지는 대신, 커뮤니티 로직을 백엔드 경유로 통일할 필요가 있었습니다.

### 핵심 변경
- `backend/app/api/v1/community.py`
  - 게시글/댓글 GET, POST, PUT, DELETE 라우터 추가
- `backend/app/services/community_service.py`
  - Supabase PostgREST 직접 호출 서비스 추가
- `backend/app/schemas/community_schema.py`
  - Pydantic 응답/요청 스키마 추가
- `backend/app/core/config.py`
  - `supabase_url`, `supabase_anon_key` 환경변수 추가
- `backend/app/main.py`
  - `community_router` 등록

### 팀원이 알아야 할 점
- 게시판은 “프론트 -> FastAPI -> Supabase” 구조입니다.
- 다만 프로필 조회/생성은 아직 프론트에서 Supabase를 직접 호출합니다.

---

## `47697cc` `feat: 유저 프로필 흐름 구현`

### 무엇을 했는가
- OAuth 로그인 후 신규 유저에게 프로필 설정을 강제하는 흐름을 붙였습니다.

### 왜 필요한가
- `auth.users`만으로는 서비스 닉네임, 계급, 부대 같은 커뮤니티 표시 정보가 부족했습니다.

### 핵심 변경
- `frontend/src/components/common/ProfileSetupModal.tsx`
  - 닉네임/계급/소속부대 입력 모달 추가
- `frontend/src/App.tsx`
  - 로그인 후 `profiles` 조회
  - 프로필 없으면 모달 표시
- `frontend/src/components/layout/Header.tsx`
  - 서비스 프로필 기반 닉네임/계급 표시

### 팀원이 알아야 할 점
- 로그인만으로 바로 게시글 작성 가능한 구조가 아닙니다.
- `profiles` 레코드가 없으면 먼저 프로필 설정을 마쳐야 합니다.

---

## `d0055bc` `feat: 커뮤니티 DB 스키마 SQL 파일 추가`

### 무엇을 했는가
- 커뮤니티 기능에 필요한 Supabase SQL 스키마를 추가했습니다.

### 왜 필요한가
- 커뮤니티는 `auth.users`만으로는 운영할 수 없어서 별도 서비스 테이블이 필요했습니다.

### 핵심 변경
- `backend/sql/community_schema.sql`
  - `profiles`
  - `community_posts`
  - `community_comments`
  - RLS 정책
  - `increment_post_views()`
  - `updated_at` 트리거

### 팀원이 알아야 할 점
- 이 SQL이 먼저 적용되지 않으면 커뮤니티 기능은 정상 동작하지 않습니다.
- 이후 커밋들은 이 스키마를 전제로 작성되었습니다.

---

## 현재 기준 체크포인트

- 커뮤니티 기능 기본 흐름은 구현 완료
- 최근 두 성능 커밋으로 게시판 체감속도 개선
- `community_performance_patch.sql` 적용 완료
- `community_rls_performance_patch.sql` 적용 완료
- 브랜치 기반 설명 문서이므로, 이후 커밋이 쌓이면 같은 형식으로 아래에 추가하면 됩니다
