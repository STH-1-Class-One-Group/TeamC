import httpx
from typing import Optional
from jose import JWTError, jwt
from app.core.config import settings

# Supabase PostgREST 기본 URL
SUPABASE_REST = f"{settings.supabase_url}/rest/v1"
_http_client: Optional[httpx.AsyncClient] = None


def _base_headers(token: Optional[str] = None) -> dict:
    """Supabase REST API 공통 헤더 생성."""
    headers = {
        "apikey": settings.supabase_anon_key,
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    else:
        headers["Authorization"] = f"Bearer {settings.supabase_anon_key}"
    return headers


def _get_http_client() -> httpx.AsyncClient:
    global _http_client

    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )

    return _http_client


async def close_http_client() -> None:
    global _http_client

    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()

    _http_client = None


# ────────────────────────────────────────────────────────────
# 게시글 관련
# ────────────────────────────────────────────────────────────

def _build_post_filters(
    category: Optional[str],
    query: Optional[str],
    search_type: str,
) -> dict:
    filters: dict[str, str] = {}
    if category and category != "all":
        filters["category"] = f"eq.{category}"

    keyword = (query or "").strip()
    if keyword:
        pattern = f"*{keyword}*"
        if search_type == "title_content":
            filters["or"] = f"(title.ilike.{pattern},content.ilike.{pattern})"
        else:
            filters["title"] = f"ilike.{pattern}"

    return filters


async def get_posts(
    page: int,
    per_page: int,
    category: Optional[str],
    query: Optional[str],
    search_type: str,
) -> dict:
    """게시글 목록 조회 (author 프로필 JOIN, 페이지네이션)."""
    offset = (page - 1) * per_page
    select = "id,post_number,title,category,views,created_at,updated_at,profiles(id,nickname,rank,avatar_url)"
    params = {
        "select": select,
        "order": "post_number.desc",
        "limit": str(per_page),
        "offset": str(offset),
    }
    filters = _build_post_filters(category=category, query=query, search_type=search_type)
    params.update(filters)

    client = _get_http_client()
    headers = {**_base_headers(), "Prefer": "count=planned"}
    res = await client.get(
        f"{SUPABASE_REST}/community_posts",
        headers=headers,
        params=params,
    )
    res.raise_for_status()
    rows = res.json()
    total = _extract_total_count(res.headers.get("content-range"), fallback=len(rows))

    posts = [_format_post_summary(r) for r in rows]
    return {"posts": posts, "total": total, "page": page, "per_page": per_page}


async def get_post_detail(post_id: str) -> Optional[dict]:
    """게시글 상세 조회."""
    select = "id,post_number,title,content,category,views,created_at,updated_at,profiles(id,nickname,rank,avatar_url)"
    client = _get_http_client()
    res = await client.get(
        f"{SUPABASE_REST}/community_posts",
        headers=_base_headers(),
        params={"select": select, "id": f"eq.{post_id}"},
    )
    res.raise_for_status()
    rows = res.json()
    if not rows:
        return None
    return _format_post(rows[0])


async def increment_views(post_id: str) -> None:
    """조회수 증가 (RPC 호출)."""
    client = _get_http_client()
    await client.post(
        f"{settings.supabase_url}/rest/v1/rpc/increment_post_views",
        headers=_base_headers(),
        json={"p_post_id": post_id},
    )


async def create_post(data: dict, token: str) -> dict:
    """게시글 작성 (author_id는 토큰에서 RLS가 검증)."""
    # author_id는 Supabase RLS에서 auth.uid()로 검증되므로
    # 토큰에서 직접 추출하여 삽입
    user_id = await _get_user_id(token)
    payload = {
        "title": data["title"],
        "content": data["content"],
        "category": data.get("category", "general"),
        "author_id": user_id,
    }
    client = _get_http_client()
    res = await client.post(
        f"{SUPABASE_REST}/community_posts",
        headers={**_base_headers(token), "Prefer": "return=representation"},
        json=payload,
    )
    res.raise_for_status()
    rows = res.json()
    return rows[0] if rows else {}


async def update_post(post_id: str, data: dict, token: str) -> dict:
    """게시글 수정 (RLS: 본인만 가능)."""
    payload = {k: v for k, v in data.items() if v is not None}
    client = _get_http_client()
    res = await client.patch(
        f"{SUPABASE_REST}/community_posts",
        headers={**_base_headers(token), "Prefer": "return=representation"},
        params={"id": f"eq.{post_id}"},
        json=payload,
    )
    res.raise_for_status()
    rows = res.json()
    return rows[0] if rows else {}


async def delete_post(post_id: str, token: str) -> None:
    """게시글 삭제 (RLS: 본인만 가능)."""
    client = _get_http_client()
    res = await client.delete(
        f"{SUPABASE_REST}/community_posts",
        headers=_base_headers(token),
        params={"id": f"eq.{post_id}"},
    )
    res.raise_for_status()


# ────────────────────────────────────────────────────────────
# 댓글 관련
# ────────────────────────────────────────────────────────────

async def get_comments(post_id: str) -> list:
    """댓글 목록 조회 (author 프로필 JOIN)."""
    select = "id,post_id,content,created_at,profiles(id,nickname,rank,avatar_url)"
    client = _get_http_client()
    res = await client.get(
        f"{SUPABASE_REST}/community_comments",
        headers=_base_headers(),
        params={
            "select": select,
            "post_id": f"eq.{post_id}",
            "order": "created_at.asc",
        },
    )
    res.raise_for_status()
    return [_format_comment(r) for r in res.json()]


async def create_comment(post_id: str, content: str, token: str) -> dict:
    """댓글 작성."""
    user_id = await _get_user_id(token)
    payload = {"post_id": post_id, "content": content, "author_id": user_id}
    client = _get_http_client()
    res = await client.post(
        f"{SUPABASE_REST}/community_comments",
        headers={**_base_headers(token), "Prefer": "return=representation"},
        json=payload,
    )
    res.raise_for_status()
    rows = res.json()
    return rows[0] if rows else {}


async def delete_comment(comment_id: str, token: str) -> None:
    """댓글 삭제 (RLS: 본인만 가능)."""
    client = _get_http_client()
    res = await client.delete(
        f"{SUPABASE_REST}/community_comments",
        headers=_base_headers(token),
        params={"id": f"eq.{comment_id}"},
    )
    res.raise_for_status()


# ────────────────────────────────────────────────────────────
# 내부 헬퍼
# ────────────────────────────────────────────────────────────

async def _get_user_id(token: str) -> str:
    """Supabase JWT에서 사용자 ID 조회."""
    try:
        claims = jwt.get_unverified_claims(token)
        user_id = claims.get("sub")
        if user_id:
            return user_id
    except JWTError:
        pass

    client = _get_http_client()
    res = await client.get(
        f"{settings.supabase_url}/auth/v1/user",
        headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"},
    )
    res.raise_for_status()
    return res.json()["id"]


def _extract_total_count(content_range: Optional[str], fallback: int) -> int:
    if not content_range or "/" not in content_range:
        return fallback

    total = content_range.split("/")[-1]
    return int(total) if total.isdigit() else fallback


def _format_post_summary(row: dict) -> dict:
    """목록 화면에 필요한 최소 필드만 응답으로 변환."""
    profile = row.get("profiles") or {}
    return {
        "id": row["id"],
        "post_number": row.get("post_number", 0),
        "title": row["title"],
        "content": "",
        "category": row["category"],
        "views": row.get("views", 0),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "author": {
            "id": profile.get("id", ""),
            "nickname": profile.get("nickname", "알 수 없음"),
            "rank": profile.get("rank"),
            "avatar_url": profile.get("avatar_url"),
        },
    }


def _format_post(row: dict) -> dict:
    """PostgREST 응답을 API 응답 형식으로 변환."""
    profile = row.get("profiles") or {}
    return {
        "id": row["id"],
        "post_number": row.get("post_number", 0),
        "title": row["title"],
        "content": row["content"],
        "category": row["category"],
        "views": row.get("views", 0),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "author": {
            "id": profile.get("id", ""),
            "nickname": profile.get("nickname", "알 수 없음"),
            "rank": profile.get("rank"),
            "avatar_url": profile.get("avatar_url"),
        },
    }


def _format_comment(row: dict) -> dict:
    """댓글 PostgREST 응답 변환."""
    profile = row.get("profiles") or {}
    return {
        "id": row["id"],
        "post_id": row["post_id"],
        "content": row["content"],
        "created_at": row["created_at"],
        "author": {
            "id": profile.get("id", ""),
            "nickname": profile.get("nickname", "알 수 없음"),
            "rank": profile.get("rank"),
            "avatar_url": profile.get("avatar_url"),
        },
    }
