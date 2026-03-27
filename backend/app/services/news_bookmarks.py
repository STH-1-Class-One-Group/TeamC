from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException
from jose import JWTError, jwt

from app.core.config import settings
from app.services.news_fetcher import (
    build_supabase_headers,
    clean_news_title,
    get_default_thumbnail_url,
    get_effective_supabase_url,
    get_news_http_client,
    normalize_news_item,
    parse_naver_pub_date,
)


def _extract_bearer_token(user_authorization: Optional[str]) -> str:
    if not user_authorization or not user_authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Login required.")
    return user_authorization.split(" ", 1)[1].strip()


async def _get_user_id(user_authorization: Optional[str]) -> str:
    token = _extract_bearer_token(user_authorization)

    try:
        claims = jwt.get_unverified_claims(token)
        user_id = claims.get("sub")
        if user_id:
            return str(user_id)
    except JWTError:
        pass

    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(status_code=500, detail="Supabase auth configuration is missing.")

    client = get_news_http_client()
    response = await client.get(
        f"{settings.supabase_url}/auth/v1/user",
        headers={
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {token}",
        },
    )
    if not response.is_success:
        raise HTTPException(status_code=401, detail="Failed to validate user session.")

    return str(response.json()["id"])


def _require_supabase_context(
    user_authorization: Optional[str],
) -> tuple[str, Dict[str, str]]:
    supabase_url = get_effective_supabase_url()
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Supabase URL is not configured.")

    headers = build_supabase_headers(user_authorization)
    if not headers:
        raise HTTPException(status_code=500, detail="Supabase credentials are not configured.")

    return supabase_url, headers


def _map_bookmark_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row.get("id"),
        "newsId": row.get("news_id"),
        "createdAt": row.get("created_at"),
    }


async def list_news_bookmarks(user_authorization: Optional[str]) -> List[Dict[str, Any]]:
    user_id = await _get_user_id(user_authorization)
    supabase_url, headers = _require_supabase_context(user_authorization)

    client = get_news_http_client()
    response = await client.get(
        f"{supabase_url}/rest/v1/bookmarks_news",
        headers=headers,
        params={
            "select": "id,news_id,created_at",
            "user_id": f"eq.{user_id}",
            "order": "created_at.desc",
        },
    )

    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail="Failed to load bookmarks.")

    return [_map_bookmark_row(row) for row in response.json()]


async def _find_news_by_id(
    news_id: str,
    supabase_url: str,
    headers: Dict[str, str],
) -> Optional[Dict[str, Any]]:
    client = get_news_http_client()
    response = await client.get(
        f"{supabase_url}/rest/v1/defense_news",
        headers=headers,
        params={
            "select": "id,title,link,published_at,thumbnail_url",
            "id": f"eq.{news_id}",
            "limit": "1",
        },
    )
    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail="Failed to resolve news item.")

    rows = response.json()
    return rows[0] if rows else None


async def _upsert_news_and_get_id(
    news: Dict[str, Any],
    supabase_url: str,
    headers: Dict[str, str],
) -> str:
    normalized = normalize_news_item(news)
    if not normalized:
        raise HTTPException(status_code=400, detail="Invalid news payload.")

    published_at = parse_naver_pub_date(normalized.get("pubDate", ""))
    payload = {
        "title": clean_news_title(normalized["title"]),
        "link": normalized["link"],
        "published_at": published_at.isoformat() if published_at else None,
        "thumbnail_url": normalized.get("thumbnail") or get_default_thumbnail_url(),
    }

    client = get_news_http_client()
    response = await client.post(
        f"{supabase_url}/rest/v1/defense_news",
        headers={
            **headers,
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
        params={
            "on_conflict": "link",
            "select": "id",
        },
        json=[payload],
    )

    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail="Failed to persist news item.")

    rows = response.json()
    if not rows:
        raise HTTPException(status_code=500, detail="News item persistence returned no rows.")

    news_id = rows[0].get("id")
    if not news_id:
        raise HTTPException(status_code=500, detail="News item ID was not returned.")

    return str(news_id)


async def create_news_bookmark(
    news_id: Optional[str],
    news: Optional[Dict[str, Any]],
    user_authorization: Optional[str],
) -> Dict[str, Any]:
    user_id = await _get_user_id(user_authorization)
    supabase_url, headers = _require_supabase_context(user_authorization)

    resolved_news_id = news_id
    if resolved_news_id:
        existing_news = await _find_news_by_id(resolved_news_id, supabase_url, headers)
        if not existing_news:
            raise HTTPException(status_code=404, detail="News item not found.")
    elif news:
        resolved_news_id = await _upsert_news_and_get_id(news, supabase_url, headers)
    else:
        raise HTTPException(status_code=400, detail="news_id or news payload is required.")

    client = get_news_http_client()
    existing_response = await client.get(
        f"{supabase_url}/rest/v1/bookmarks_news",
        headers=headers,
        params={
            "select": "id,news_id,created_at",
            "user_id": f"eq.{user_id}",
            "news_id": f"eq.{resolved_news_id}",
            "limit": "1",
        },
    )
    if not existing_response.is_success:
        raise HTTPException(status_code=existing_response.status_code, detail="Failed to check bookmark status.")

    existing_rows = existing_response.json()
    if existing_rows:
        return _map_bookmark_row(existing_rows[0])

    insert_response = await client.post(
        f"{supabase_url}/rest/v1/bookmarks_news",
        headers={
            **headers,
            "Prefer": "return=representation",
        },
        json={
            "user_id": user_id,
            "news_id": resolved_news_id,
        },
    )
    if not insert_response.is_success:
        raise HTTPException(status_code=insert_response.status_code, detail="Failed to save bookmark.")

    rows = insert_response.json()
    if not rows:
        raise HTTPException(status_code=500, detail="Bookmark creation returned no rows.")

    return _map_bookmark_row(rows[0])


async def delete_news_bookmark(news_id: str, user_authorization: Optional[str]) -> Dict[str, bool]:
    user_id = await _get_user_id(user_authorization)
    supabase_url, headers = _require_supabase_context(user_authorization)

    client = get_news_http_client()
    response = await client.delete(
        f"{supabase_url}/rest/v1/bookmarks_news",
        headers=headers,
        params={
            "user_id": f"eq.{user_id}",
            "news_id": f"eq.{news_id}",
        },
    )
    if not response.is_success:
        raise HTTPException(status_code=response.status_code, detail="Failed to delete bookmark.")

    return {"success": True}
