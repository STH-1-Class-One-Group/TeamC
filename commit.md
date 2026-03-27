# 커밋 메시지 정리

현재 변경 파일 기준:

- `backend/app/core/config.py`
- `frontend/src/api/apiBaseUrl.ts`
- `frontend/src/features/community/CommunityPage.tsx`
- `frontend/src/features/community/PostDetailPage.tsx`
- `frontend/src/features/community/PostWritePage.tsx`
- `frontend/src/features/community/components/CommentSection.tsx`
- `frontend/src/features/meal/MealPage.tsx`
- `frontend/src/features/news/NewsPage.tsx`
- `frontend/src/features/news/newsApi.ts`

## 추천 커밋 메시지

### 1. 한 번에 묶는 경우

```bash
fix: 커뮤니티 CORS 문제와 API URL 정규화 처리
```

본문 예시:

```text
- REACT_APP_API_URL trailing slash를 제거하는 공통 API URL 유틸 추가
- 커뮤니티/뉴스/식단 요청을 공통 API URL 빌더로 통일
- 백엔드 CORS origin 정규화 및 배포 프론트 도메인 기본 허용 추가
```

### 2. 프론트/백 분리해서 커밋하는 경우

프론트:

```bash
fix(frontend): 커뮤니티와 뉴스 API 경로를 공통 URL 빌더로 정리
```

본문 예시:

```text
- API base URL의 trailing slash를 제거하는 유틸 추가
- 커뮤니티 관련 fetch 경로를 공통 빌더 사용으로 변경
- 뉴스/식단 API 요청도 동일 규칙으로 정리
```

백엔드:

```bash
fix(backend): 배포 프론트 도메인 CORS 허용 및 origin 정규화 추가
```

본문 예시:

```text
- CORS origin 비교 전에 trailing slash를 제거하도록 정규화
- Cloudflare Pages 배포 도메인을 기본 허용 목록에 추가
- .env.example에 BACKEND_CORS_ORIGINS 예시 반영
```

## 가장 무난한 최종안

```bash
fix: 커뮤니티 CORS 문제와 API URL 정규화 처리
```

이유:

- 현재 변경 범위가 모두 같은 장애 원인에 연결되어 있음
- 프론트와 백엔드가 함께 수정돼 한 커밋으로 설명하기 자연스러움
- Conventional Commits 기준에서도 `fix`가 가장 적절함
