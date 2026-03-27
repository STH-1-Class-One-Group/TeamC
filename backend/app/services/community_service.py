import asyncio
import logging
from typing import Any, Optional

import httpx
from fastapi import HTTPException
from jose import JWTError, jwt
from psycopg2.extras import RealDictCursor

from app.core.config import settings
from app.db.session import get_db_connection
from app.services.news_fetcher import get_effective_supabase_url

logger = logging.getLogger(__name__)

NETWORK_TIMEOUT = httpx.Timeout(10.0, connect=5.0)
_http_client: Optional[httpx.AsyncClient] = None


def _get_supabase_url() -> str:
    supabase_url = get_effective_supabase_url().rstrip("/")
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Supabase URL is not configured.")
    return supabase_url


def _get_supabase_rest_url() -> str:
    return f"{_get_supabase_url()}/rest/v1"


def _get_server_api_key() -> str:
    api_key = settings.supabase_service_role_key or settings.supabase_anon_key
    if not api_key:
        raise HTTPException(status_code=500, detail="Supabase credentials are not configured.")
    return api_key


def _base_headers(token: Optional[str] = None) -> dict[str, str]:
    headers = {"Content-Type": "application/json"}

    if token:
        if not settings.supabase_anon_key:
            raise HTTPException(status_code=500, detail="Supabase anon key is not configured.")
        headers["apikey"] = settings.supabase_anon_key
        headers["Authorization"] = f"Bearer {token}"
        return headers

    api_key = _get_server_api_key()
    headers["apikey"] = api_key
    headers["Authorization"] = f"Bearer {api_key}"
    return headers


def _get_http_client() -> httpx.AsyncClient:
    global _http_client

    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=NETWORK_TIMEOUT,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=50),
        )

    return _http_client


async def close_http_client() -> None:
    global _http_client

    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()

    _http_client = None


def _parse_supabase_error(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = None

    if isinstance(payload, dict):
        for key in ("message", "msg", "detail", "error_description", "error"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    body = response.text.strip()
    return body[:300] if body else "Community service upstream request failed."


async def _request(method: str, url: str, **kwargs: Any) -> httpx.Response:
    client = _get_http_client()

    try:
        response = await client.request(method, url, **kwargs)
        response.raise_for_status()
        return response
    except httpx.HTTPStatusError as error:
        response = error.response
        detail = _parse_supabase_error(response)
        status_code = response.status_code if 400 <= response.status_code < 500 else 502
        logger.warning(
            "Community upstream HTTP error: %s %s -> %s %s",
            method,
            url,
            response.status_code,
            detail,
        )
        raise HTTPException(status_code=status_code, detail=detail) from error
    except httpx.RequestError as error:
        logger.exception("Community upstream request failed: %s %s", method, url)
        raise HTTPException(
            status_code=502,
            detail="Community service upstream request failed.",
        ) from error


def _build_post_filters(
    category: Optional[str],
    query: Optional[str],
    search_type: str,
) -> dict[str, str]:
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


def _build_db_post_filters(
    category: Optional[str],
    query: Optional[str],
    search_type: str,
) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []

    if category and category != "all":
        clauses.append("posts.category = %s")
        params.append(category)

    keyword = (query or "").strip()
    if keyword:
        pattern = f"%{keyword}%"
        if search_type == "title_content":
            clauses.append("(posts.title ILIKE %s OR posts.content ILIKE %s)")
            params.extend([pattern, pattern])
        else:
            clauses.append("posts.title ILIKE %s")
            params.append(pattern)

    where_clause = f"where {' and '.join(clauses)}" if clauses else ""
    return where_clause, params


def _normalize_profile(value: Any) -> dict[str, Any]:
    if isinstance(value, list):
        value = value[0] if value else {}
    if isinstance(value, dict):
        return value
    return {}


def _author_payload(profile: Any) -> dict[str, Any]:
    normalized_profile = _normalize_profile(profile)
    return {
        "id": normalized_profile.get("id", ""),
        "nickname": normalized_profile.get("nickname", "알 수 없음"),
        "rank": normalized_profile.get("rank"),
        "avatar_url": normalized_profile.get("avatar_url"),
    }


def _map_db_post_row(row: dict[str, Any], include_content: bool) -> dict[str, Any]:
    return {
        "id": row.get("id", ""),
        "post_number": row.get("post_number", 0) or 0,
        "title": row.get("title", ""),
        "content": row.get("content", "") if include_content else "",
        "category": row.get("category", "general"),
        "views": row.get("views", 0) or 0,
        "created_at": row.get("created_at").isoformat() if row.get("created_at") else "",
        "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else "",
        "author": {
            "id": row.get("author_id", ""),
            "nickname": row.get("author_nickname", "알 수 없음"),
            "rank": row.get("author_rank"),
            "avatar_url": row.get("author_avatar_url"),
        },
    }


def _map_db_comment_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id", ""),
        "post_id": row.get("post_id", ""),
        "content": row.get("content", ""),
        "created_at": row.get("created_at").isoformat() if row.get("created_at") else "",
        "author": {
            "id": row.get("author_id", ""),
            "nickname": row.get("author_nickname", "알 수 없음"),
            "rank": row.get("author_rank"),
            "avatar_url": row.get("author_avatar_url"),
        },
    }


def _fetch_posts_from_db(
    page: int,
    per_page: int,
    category: Optional[str],
    query: Optional[str],
    search_type: str,
) -> dict[str, Any]:
    if not settings.database_url:
        raise HTTPException(status_code=502, detail="Community service upstream request failed.")

    where_clause, where_params = _build_db_post_filters(category, query, search_type)
    offset = (page - 1) * per_page

    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                f"""
                select count(*) as total
                from public.community_posts posts
                {where_clause}
                """,
                tuple(where_params),
            )
            total_row = cursor.fetchone() or {"total": 0}

            cursor.execute(
                f"""
                select
                    posts.id,
                    posts.post_number,
                    posts.title,
                    posts.category,
                    posts.views,
                    posts.created_at,
                    posts.updated_at,
                    profiles.id as author_id,
                    profiles.nickname as author_nickname,
                    profiles.rank as author_rank,
                    profiles.avatar_url as author_avatar_url
                from public.community_posts posts
                join public.profiles profiles on profiles.id = posts.author_id
                {where_clause}
                order by posts.post_number desc
                limit %s offset %s
                """,
                tuple([*where_params, per_page, offset]),
            )
            rows = cursor.fetchall()

    return {
        "posts": [_map_db_post_row(dict(row), include_content=False) for row in rows],
        "total": int(total_row["total"]),
        "page": page,
        "per_page": per_page,
    }


def _fetch_post_detail_from_db(post_id: str) -> Optional[dict[str, Any]]:
    if not settings.database_url:
        raise HTTPException(status_code=502, detail="Community service upstream request failed.")

    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                select
                    posts.id,
                    posts.post_number,
                    posts.title,
                    posts.content,
                    posts.category,
                    posts.views,
                    posts.created_at,
                    posts.updated_at,
                    profiles.id as author_id,
                    profiles.nickname as author_nickname,
                    profiles.rank as author_rank,
                    profiles.avatar_url as author_avatar_url
                from public.community_posts posts
                join public.profiles profiles on profiles.id = posts.author_id
                where posts.id = %s
                """,
                (post_id,),
            )
            row = cursor.fetchone()

    return _map_db_post_row(dict(row), include_content=True) if row else None


def _fetch_comments_from_db(post_id: str) -> list[dict[str, Any]]:
    if not settings.database_url:
        raise HTTPException(status_code=502, detail="Community service upstream request failed.")

    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                select
                    comments.id,
                    comments.post_id,
                    comments.content,
                    comments.created_at,
                    profiles.id as author_id,
                    profiles.nickname as author_nickname,
                    profiles.rank as author_rank,
                    profiles.avatar_url as author_avatar_url
                from public.community_comments comments
                join public.profiles profiles on profiles.id = comments.author_id
                where comments.post_id = %s
                order by comments.created_at asc
                """,
                (post_id,),
            )
            rows = cursor.fetchall()

    return [_map_db_comment_row(dict(row)) for row in rows]


def _increment_views_in_db(post_id: str) -> None:
    if not settings.database_url:
        return

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                update public.community_posts
                set views = views + 1
                where id = %s
                """,
                (post_id,),
            )
        conn.commit()


async def get_posts(
    page: int,
    per_page: int,
    category: Optional[str],
    query: Optional[str],
    search_type: str,
) -> dict[str, Any]:
    params = {
        "select": "id,post_number,title,category,views,created_at,updated_at,profiles(id,nickname,rank,avatar_url)",
        "order": "post_number.desc",
        "limit": str(per_page),
        "offset": str((page - 1) * per_page),
    }
    params.update(_build_post_filters(category=category, query=query, search_type=search_type))

    try:
        response = await _request(
            "GET",
            f"{_get_supabase_rest_url()}/community_posts",
            headers={**_base_headers(), "Prefer": "count=planned"},
            params=params,
        )
        rows = response.json()
        total = _extract_total_count(response.headers.get("content-range"), fallback=len(rows))
        return {
            "posts": [_format_post_summary(row) for row in rows],
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    except HTTPException as error:
        if error.status_code != 502:
            raise
        logger.warning("Falling back to direct DB for community post list.")
        return await asyncio.to_thread(_fetch_posts_from_db, page, per_page, category, query, search_type)


async def get_post_detail(post_id: str) -> Optional[dict[str, Any]]:
    try:
        response = await _request(
            "GET",
            f"{_get_supabase_rest_url()}/community_posts",
            headers=_base_headers(),
            params={
                "select": "id,post_number,title,content,category,views,created_at,updated_at,profiles(id,nickname,rank,avatar_url)",
                "id": f"eq.{post_id}",
            },
        )
        rows = response.json()
        if not rows:
            return None
        return _format_post(rows[0])
    except HTTPException as error:
        if error.status_code != 502:
            raise
        logger.warning("Falling back to direct DB for community post detail.")
        return await asyncio.to_thread(_fetch_post_detail_from_db, post_id)


async def increment_views(post_id: str) -> None:
    try:
        await _request(
            "POST",
            f"{_get_supabase_rest_url()}/rpc/increment_post_views",
            headers=_base_headers(),
            json={"p_post_id": post_id},
        )
    except HTTPException as error:
        if error.status_code != 502:
            logger.warning("Increment views failed with non-retriable status: %s", error.detail)
            return
        logger.warning("Falling back to direct DB for community view increment.")
        await asyncio.to_thread(_increment_views_in_db, post_id)


async def create_post(data: dict[str, Any], token: str) -> dict[str, Any]:
    user_id = await _get_user_id(token)
    response = await _request(
        "POST",
        f"{_get_supabase_rest_url()}/community_posts",
        headers={**_base_headers(token), "Prefer": "return=representation"},
        json={
            "title": data["title"],
            "content": data["content"],
            "category": data.get("category", "general"),
            "author_id": user_id,
        },
    )
    rows = response.json()
    return rows[0] if rows else {}


async def update_post(post_id: str, data: dict[str, Any], token: str) -> dict[str, Any]:
    response = await _request(
        "PATCH",
        f"{_get_supabase_rest_url()}/community_posts",
        headers={**_base_headers(token), "Prefer": "return=representation"},
        params={"id": f"eq.{post_id}"},
        json={key: value for key, value in data.items() if value is not None},
    )
    rows = response.json()
    return rows[0] if rows else {}


async def delete_post(post_id: str, token: str) -> None:
    await _request(
        "DELETE",
        f"{_get_supabase_rest_url()}/community_posts",
        headers=_base_headers(token),
        params={"id": f"eq.{post_id}"},
    )


async def get_comments(post_id: str) -> list[dict[str, Any]]:
    try:
        response = await _request(
            "GET",
            f"{_get_supabase_rest_url()}/community_comments",
            headers=_base_headers(),
            params={
                "select": "id,post_id,content,created_at,profiles(id,nickname,rank,avatar_url)",
                "post_id": f"eq.{post_id}",
                "order": "created_at.asc",
            },
        )
        return [_format_comment(row) for row in response.json()]
    except HTTPException as error:
        if error.status_code != 502:
            raise
        logger.warning("Falling back to direct DB for community comments.")
        return await asyncio.to_thread(_fetch_comments_from_db, post_id)


async def create_comment(post_id: str, content: str, token: str) -> dict[str, Any]:
    user_id = await _get_user_id(token)
    response = await _request(
        "POST",
        f"{_get_supabase_rest_url()}/community_comments",
        headers={**_base_headers(token), "Prefer": "return=representation"},
        json={"post_id": post_id, "content": content, "author_id": user_id},
    )
    rows = response.json()
    return rows[0] if rows else {}


async def delete_comment(comment_id: str, token: str) -> None:
    await _request(
        "DELETE",
        f"{_get_supabase_rest_url()}/community_comments",
        headers=_base_headers(token),
        params={"id": f"eq.{comment_id}"},
    )


async def _get_user_id(token: str) -> str:
    try:
        claims = jwt.get_unverified_claims(token)
        user_id = claims.get("sub")
        if user_id:
            return user_id
    except JWTError:
        pass

    response = await _request(
        "GET",
        f"{_get_supabase_url()}/auth/v1/user",
        headers={"apikey": _get_server_api_key(), "Authorization": f"Bearer {token}"},
    )
    user = response.json()
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Failed to validate user session.")
    return user_id


def _extract_total_count(content_range: Optional[str], fallback: int) -> int:
    if not content_range or "/" not in content_range:
        return fallback

    total = content_range.split("/")[-1]
    return int(total) if total.isdigit() else fallback


def _format_post_summary(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id", ""),
        "post_number": row.get("post_number", 0) or 0,
        "title": row.get("title", ""),
        "content": "",
        "category": row.get("category", "general"),
        "views": row.get("views", 0) or 0,
        "created_at": row.get("created_at", ""),
        "updated_at": row.get("updated_at", ""),
        "author": _author_payload(row.get("profiles")),
    }


def _format_post(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id", ""),
        "post_number": row.get("post_number", 0) or 0,
        "title": row.get("title", ""),
        "content": row.get("content", ""),
        "category": row.get("category", "general"),
        "views": row.get("views", 0) or 0,
        "created_at": row.get("created_at", ""),
        "updated_at": row.get("updated_at", ""),
        "author": _author_payload(row.get("profiles")),
    }


def _format_comment(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id", ""),
        "post_id": row.get("post_id", ""),
        "content": row.get("content", ""),
        "created_at": row.get("created_at", ""),
        "author": _author_payload(row.get("profiles")),
    }
