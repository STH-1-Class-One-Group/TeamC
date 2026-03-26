import asyncio
import html
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx
from psycopg2.extras import RealDictCursor

from app.core.config import settings
from app.db.session import get_db_connection

logger = logging.getLogger(__name__)

NAVER_NEWS_API_URL = "https://openapi.naver.com/v1/search/news.json"
NAVER_IMAGE_API_URL = "https://openapi.naver.com/v1/search/image.json"
DEFENSE_NEWS_QUERY = '국방 OR "방위산업" OR "K-방산"'
NETWORK_TIMEOUT = httpx.Timeout(5.0, connect=2.0)


_http_client: Optional[httpx.AsyncClient] = None


def get_news_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=NETWORK_TIMEOUT,
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
        )
    return _http_client


async def close_news_http_client() -> None:
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()
    _http_client = None


def infer_supabase_url_from_database_url() -> str:
    if not settings.database_url:
        return ""

    try:
        parsed = urlparse(settings.database_url)
        hostname = parsed.hostname or ""
        prefix = "db."
        suffix = ".supabase.co"
        if hostname.startswith(prefix) and hostname.endswith(suffix):
            project_ref = hostname[len(prefix) : -len(suffix)]
            if project_ref:
                return f"https://{project_ref}.supabase.co"
    except Exception:
        logger.exception("Failed to infer Supabase URL from DATABASE_URL.")
    return ""


def get_effective_supabase_url() -> str:
    return settings.supabase_url or infer_supabase_url_from_database_url()


def get_default_thumbnail_url() -> str:
    supabase_url = get_effective_supabase_url()
    if supabase_url:
        return f"{supabase_url}/storage/v1/object/public/food-media/thumbnail.png"
    return "https://via.placeholder.com/300x200?text=No+Image"


def truncate_text(value: str, limit: int = 300) -> str:
    if len(value) <= limit:
        return value
    return value[:limit] + "...(truncated)"


def mask_value(value: str, keep: int = 6) -> str:
    if not value:
        return ""
    if len(value) <= keep * 2:
        return "*" * len(value)
    return f"{value[:keep]}...{value[-keep:]}"


def get_supabase_auth_mode(user_authorization: Optional[str] = None) -> str:
    if user_authorization and user_authorization.lower().startswith("bearer "):
        return "user_jwt"
    if settings.supabase_service_role_key:
        return "service_role"
    if settings.supabase_anon_key:
        return "anon"
    return "missing"


def build_supabase_headers(user_authorization: Optional[str] = None) -> Optional[Dict[str, str]]:
    supabase_url = get_effective_supabase_url()
    if not supabase_url:
        return None

    if user_authorization and user_authorization.lower().startswith("bearer "):
        if not settings.supabase_anon_key:
            return None
        return {
            "apikey": settings.supabase_anon_key,
            "Authorization": user_authorization,
            "Content-Type": "application/json",
        }

    token = settings.supabase_service_role_key or settings.supabase_anon_key
    if not token:
        return None

    return {
        "apikey": token,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def build_runtime_diagnostics(user_authorization: Optional[str] = None) -> Dict[str, Any]:
    effective_supabase_url = get_effective_supabase_url()
    return {
        "config": {
            "database_url_present": bool(settings.database_url),
            "database_host": urlparse(settings.database_url).hostname if settings.database_url else "",
            "supabase_url_present": bool(settings.supabase_url),
            "supabase_url_effective": effective_supabase_url,
            "supabase_url_inferred": effective_supabase_url and not bool(settings.supabase_url),
            "supabase_anon_key_present": bool(settings.supabase_anon_key),
            "supabase_service_role_key_present": bool(settings.supabase_service_role_key),
            "supabase_auth_mode": get_supabase_auth_mode(user_authorization),
            "request_authorization_present": bool(user_authorization),
            "naver_client_id_present": bool(settings.naver_client_id),
            "naver_client_secret_present": bool(settings.naver_client_secret),
            "supabase_anon_key_masked": mask_value(settings.supabase_anon_key),
            "supabase_service_role_key_masked": mask_value(settings.supabase_service_role_key),
        }
    }


def clean_news_title(raw_title: str) -> str:
    if not raw_title:
        return ""
    cleaned = raw_title.replace("<b>", "").replace("</b>", "")
    return html.unescape(cleaned)


def parse_naver_pub_date(pub_date: str) -> Optional[datetime]:
    if not pub_date:
        return None

    try:
        parsed = parsedate_to_datetime(pub_date)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    except (TypeError, ValueError) as error:
        logger.warning("Failed to parse Naver pubDate '%s': %s", pub_date, error)
        return None


def format_pub_date(value: Optional[datetime]) -> str:
    if not value:
        return ""

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone().strftime("%Y-%m-%d %H:%M")


def map_cached_news_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "title": row["title"],
        "link": row["link"],
        "pubDate": format_pub_date(row.get("published_at")),
        "thumbnail": row.get("thumbnail_url") or get_default_thumbnail_url(),
    }


def normalize_news_item(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    title = clean_news_title(item.get("title", ""))
    link = item.get("link")
    if not title or not link:
        return None

    return {
        "title": title,
        "link": link,
        "pubDate": item.get("pubDate", ""),
        "thumbnail": item.get("thumbnail") or get_default_thumbnail_url(),
    }


async def fetch_cached_news_from_supabase(
    limit: int,
    start: int,
    user_authorization: Optional[str] = None,
) -> List[Dict[str, Any]]:
    result = await fetch_cached_news_from_supabase_debug(limit, start, user_authorization)
    return result["items"]


async def fetch_cached_news_from_supabase_debug(
    limit: int,
    start: int,
    user_authorization: Optional[str] = None,
) -> Dict[str, Any]:
    headers = build_supabase_headers(user_authorization)
    supabase_url = get_effective_supabase_url()
    debug = {
        "path": "supabase_rest_read",
        "attempted": True,
        "success": False,
        "reason": "",
        "item_count": 0,
        "status_code": None,
        "response_text": "",
        "supabase_url": supabase_url,
        "auth_mode": get_supabase_auth_mode(user_authorization),
    }

    if not supabase_url:
        debug["attempted"] = False
        debug["reason"] = "SUPABASE_URL missing and could not be inferred from DATABASE_URL."
        logger.info(debug["reason"])
        return {**debug, "items": []}

    if not headers:
        debug["attempted"] = False
        debug["reason"] = "Supabase key missing. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY."
        logger.info(debug["reason"])
        return {**debug, "items": []}

    offset = max(start - 1, 0)
    params = {
        "select": "title,link,published_at,thumbnail_url",
        "order": "published_at.desc.nullslast,created_at.desc",
        "limit": str(limit),
        "offset": str(offset),
    }

    try:
        client = get_news_http_client()
        response = await client.get(
            f"{supabase_url}/rest/v1/defense_news",
            headers=headers,
            params=params,
        )
        debug["status_code"] = response.status_code
        debug["response_text"] = truncate_text(response.text)

        if response.is_success:
            rows = response.json()
            debug["success"] = True
            debug["item_count"] = len(rows)
            logger.info("Loaded %s news items from Supabase REST cache.", len(rows))
            return {**debug, "items": [map_cached_news_row(row) for row in rows]}

        debug["reason"] = "Supabase REST cache read failed."
        logger.warning(
            "Supabase REST cache read failed (%s, auth=%s): %s",
            response.status_code,
            get_supabase_auth_mode(user_authorization),
            response.text,
        )
    except Exception as error:
        debug["reason"] = f"{type(error).__name__}: {error}"
        logger.exception("Supabase REST cache read raised an exception.")

    return {**debug, "items": []}


async def upsert_defense_news_to_supabase(
    items: List[Dict[str, Any]],
    user_authorization: Optional[str] = None,
) -> bool:
    result = await upsert_defense_news_to_supabase_debug(items, user_authorization)
    return result["success"]


async def upsert_defense_news_to_supabase_debug(
    items: List[Dict[str, Any]],
    user_authorization: Optional[str] = None,
) -> Dict[str, Any]:
    headers = build_supabase_headers(user_authorization)
    supabase_url = get_effective_supabase_url()
    debug = {
        "path": "supabase_rest_write",
        "attempted": True,
        "success": False,
        "reason": "",
        "payload_count": 0,
        "status_code": None,
        "response_text": "",
        "supabase_url": supabase_url,
        "auth_mode": get_supabase_auth_mode(user_authorization),
    }

    if not supabase_url:
        debug["attempted"] = False
        debug["reason"] = "SUPABASE_URL missing and could not be inferred from DATABASE_URL."
        logger.info(debug["reason"])
        return debug

    if not headers:
        debug["attempted"] = False
        debug["reason"] = "Supabase key missing. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY."
        logger.info(debug["reason"])
        return debug

    payload = []
    for item in items:
        normalized = normalize_news_item(item)
        if not normalized:
            continue
        published_at = parse_naver_pub_date(normalized["pubDate"])
        payload.append(
            {
                "title": normalized["title"],
                "link": normalized["link"],
                "published_at": published_at.isoformat() if published_at else None,
                "thumbnail_url": normalized["thumbnail"],
            }
        )

    debug["payload_count"] = len(payload)

    if not payload:
        debug["attempted"] = False
        debug["reason"] = "No valid news payload to save."
        logger.warning(debug["reason"])
        return debug

    request_headers = {
        **headers,
        "Prefer": "resolution=merge-duplicates,return=representation",
    }

    try:
        client = get_news_http_client()
        response = await client.post(
            f"{supabase_url}/rest/v1/defense_news",
            headers=request_headers,
            params={"on_conflict": "link", "select": "link"},
            json=payload,
        )

        debug["status_code"] = response.status_code
        debug["response_text"] = truncate_text(response.text)

        if response.is_success:
            debug["success"] = True
            logger.info(
                "Upserted %s news items via Supabase REST using %s auth.",
                len(payload),
                get_supabase_auth_mode(user_authorization),
            )
            return debug

        debug["reason"] = "Supabase REST upsert failed."
        logger.error(
            "Supabase REST upsert failed (%s, auth=%s): %s",
            response.status_code,
            get_supabase_auth_mode(user_authorization),
            response.text,
        )
    except Exception as error:
        debug["reason"] = f"{type(error).__name__}: {error}"
        logger.exception("Supabase REST upsert raised an exception.")

    return debug


def fetch_cached_news_from_db(limit: int, start: int) -> List[Dict[str, Any]]:
    result = fetch_cached_news_from_db_debug(limit, start)
    return result["items"]


def fetch_cached_news_from_db_debug(limit: int, start: int) -> Dict[str, Any]:
    debug = {
        "path": "direct_db_read",
        "attempted": True,
        "success": False,
        "reason": "",
        "item_count": 0,
        "database_host": urlparse(settings.database_url).hostname if settings.database_url else "",
    }

    if not settings.database_url:
        debug["attempted"] = False
        debug["reason"] = "DATABASE_URL missing."
        logger.info(debug["reason"])
        return {**debug, "items": []}

    try:
        offset = max(start - 1, 0)
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    select title, link, published_at, thumbnail_url
                    from public.defense_news
                    order by published_at desc nulls last, created_at desc
                    limit %s offset %s
                    """,
                    (limit, offset),
                )
                rows = cursor.fetchall()

        debug["success"] = True
        debug["item_count"] = len(rows)
        logger.info("Loaded %s news items from direct DB cache.", len(rows))
        return {**debug, "items": [map_cached_news_row(row) for row in rows]}
    except Exception as error:
        debug["reason"] = f"{type(error).__name__}: {error}"
        logger.exception("Direct DB cache read raised an exception.")
        return {**debug, "items": []}


def upsert_defense_news_to_db(items: List[Dict[str, Any]]) -> bool:
    result = upsert_defense_news_to_db_debug(items)
    return result["success"]


def upsert_defense_news_to_db_debug(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    debug = {
        "path": "direct_db_write",
        "attempted": True,
        "success": False,
        "reason": "",
        "payload_count": 0,
        "database_host": urlparse(settings.database_url).hostname if settings.database_url else "",
    }

    if not settings.database_url:
        debug["attempted"] = False
        debug["reason"] = "DATABASE_URL missing."
        logger.info(debug["reason"])
        return debug

    rows = []
    for item in items:
        normalized = normalize_news_item(item)
        if not normalized:
            continue
        rows.append(
            (
                normalized["title"],
                normalized["link"],
                parse_naver_pub_date(normalized["pubDate"]),
                normalized["thumbnail"],
            )
        )

    debug["payload_count"] = len(rows)

    if not rows:
        debug["attempted"] = False
        debug["reason"] = "No valid news rows."
        logger.warning(debug["reason"])
        return debug

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.executemany(
                    """
                    insert into public.defense_news (title, link, published_at, thumbnail_url)
                    values (%s, %s, %s, %s)
                    on conflict (link) do update
                    set
                        title = excluded.title,
                        published_at = excluded.published_at,
                        thumbnail_url = excluded.thumbnail_url
                    """,
                    rows,
                )
            conn.commit()
        debug["success"] = True
        logger.info("Upserted %s news items through direct DB.", len(rows))
        return debug
    except Exception as error:
        debug["reason"] = f"{type(error).__name__}: {error}"
        logger.exception("Direct DB upsert raised an exception.")
        return debug


async def fetch_cached_news(
    limit: int,
    start: int,
    user_authorization: Optional[str] = None,
) -> List[Dict[str, Any]]:
    supabase_debug = await fetch_cached_news_from_supabase_debug(limit, start, user_authorization)
    if len(supabase_debug["items"]) >= limit:
        return supabase_debug["items"]

    db_debug = await asyncio.to_thread(fetch_cached_news_from_db_debug, limit, start)
    return db_debug["items"] if len(db_debug["items"]) >= limit else (supabase_debug["items"] or db_debug["items"])


async def persist_defense_news(
    items: List[Dict[str, Any]],
    user_authorization: Optional[str] = None,
) -> Dict[str, Any]:
    # Persist concurrently
    supabase_task = upsert_defense_news_to_supabase_debug(items, user_authorization)
    db_task = asyncio.to_thread(upsert_defense_news_to_db_debug, items)
    
    supabase_debug, db_debug = await asyncio.gather(supabase_task, db_task)

    if not supabase_debug["success"] and not db_debug["success"]:
        logger.error("Defense news cache persistence failed on both Supabase REST and direct DB paths.")

    return {
        "supabase": supabase_debug,
        "database": db_debug,
    }


async def fetch_naver_news(query: str, display: int = 4, start: int = 1) -> List[Dict[str, Any]]:
    headers = {
        "X-Naver-Client-Id": settings.naver_client_id,
        "X-Naver-Client-Secret": settings.naver_client_secret,
    }
    params = {
        "query": query,
        "display": display,
        "start": start,
        "sort": "sim",
    }

    client = get_news_http_client()
    try:
        response = await client.get(NAVER_NEWS_API_URL, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        items = data.get("items", [])
        logger.info("Fetched %s items from Naver News API.", len(items))
        return items
    except Exception:
        logger.exception("Naver news fetch failed.")
        return []


async def fetch_news_thumbnail(title: str, client: Optional[httpx.AsyncClient] = None) -> Optional[str]:
    headers = {
        "X-Naver-Client-Id": settings.naver_client_id,
        "X-Naver-Client-Secret": settings.naver_client_secret,
    }
    params = {
        "query": title,
        "display": 1,
        "sort": "sim",
    }

    if client is None:
        client = get_news_http_client()

    try:
        response = await client.get(NAVER_IMAGE_API_URL, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        items = data.get("items", [])
        if items:
            return items[0].get("link")
        return None
    except Exception:
        logger.exception("Naver image fetch failed for title '%s'.", title)
        return None


async def enrich_news_items(news_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    semaphore = asyncio.Semaphore(5)
    client = get_news_http_client()

    async def enrich_item(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        clean_title = clean_news_title(item.get("title", ""))
        if not clean_title or not item.get("link"):
            return None

        # If item already has a thumbnail from some source, skip Naver Image API
        thumbnail = item.get("thumbnail")
        if not thumbnail or thumbnail == get_default_thumbnail_url():
            async with semaphore:
                thumbnail = await fetch_news_thumbnail(clean_title, client=client)

        return normalize_news_item(
            {
                "title": clean_title,
                "link": item.get("link"),
                "pubDate": item.get("pubDate"),
                "thumbnail": thumbnail or get_default_thumbnail_url(),
            }
        )

    enriched_items = await asyncio.gather(*(enrich_item(item) for item in news_items))
    return [item for item in enriched_items if item]


async def get_defense_news(
    limit: int = 4,
    start: int = 1,
    force_refresh: bool = False,
    user_authorization: Optional[str] = None,
) -> List[Dict[str, Any]]:
    if not force_refresh:
        cached_news = await fetch_cached_news(limit, start, user_authorization)
        # return if we have enough items, or some items at least
        if len(cached_news) >= limit:
            return cached_news

    news_items = await fetch_naver_news(DEFENSE_NEWS_QUERY, display=limit, start=start)
    if not news_items and not force_refresh:
        return await fetch_cached_news(limit, start, user_authorization)

    results = await enrich_news_items(news_items)

    # Persist in background task or just await it if we want to ensure it's saved
    # But for responsiveness, we could return 'results' immediately and fire-and-forget persistence
    # However, let's keep it awaited but optimized.
    await persist_defense_news(results, user_authorization)

    # Return the results we just fetched instead of re-fetching from DB
    return results


async def debug_defense_news(
    limit: int = 4,
    start: int = 1,
    force_refresh: bool = True,
    user_authorization: Optional[str] = None,
) -> Dict[str, Any]:
    diagnostics = build_runtime_diagnostics(user_authorization)
    diagnostics["request"] = {
        "limit": limit,
        "start": start,
        "force_refresh": force_refresh,
    }

    read_before_supabase = await fetch_cached_news_from_supabase_debug(limit, start, user_authorization)
    read_before_db = await asyncio.to_thread(fetch_cached_news_from_db_debug, limit, start)
    diagnostics["cache_before"] = {
        "supabase": {k: v for k, v in read_before_supabase.items() if k != "items"},
        "database": {k: v for k, v in read_before_db.items() if k != "items"},
    }

    if not force_refresh and (read_before_supabase["items"] or read_before_db["items"]):
        diagnostics["naver_fetch"] = {
            "requested_count": limit,
            "received_count": 0,
            "skipped": True,
            "reason": "force_refresh=false and cache already has data.",
        }
        diagnostics["normalized_news"] = {"count": 0, "sample": []}
        diagnostics["persist"] = {
            "supabase": {
                "path": "supabase_rest_write",
                "attempted": False,
                "success": False,
                "reason": "Skipped because force_refresh=false and cache already has data.",
            },
            "database": {
                "path": "direct_db_write",
                "attempted": False,
                "success": False,
                "reason": "Skipped because force_refresh=false and cache already has data.",
            },
        }
        diagnostics["cache_after"] = diagnostics["cache_before"]
        diagnostics["final_items"] = read_before_supabase["items"] or read_before_db["items"]
        return diagnostics

    news_items = await fetch_naver_news(DEFENSE_NEWS_QUERY, display=limit, start=start)
    diagnostics["naver_fetch"] = {
        "requested_count": limit,
        "received_count": len(news_items),
        "sample_links": [item.get("link") for item in news_items[:3]],
    }

    normalized_items = await enrich_news_items(news_items)

    diagnostics["normalized_news"] = {
        "count": len(normalized_items),
        "sample": normalized_items[:2],
    }

    diagnostics["persist"] = await persist_defense_news(normalized_items, user_authorization)

    read_after_supabase = await fetch_cached_news_from_supabase_debug(limit, start, user_authorization)
    read_after_db = await asyncio.to_thread(fetch_cached_news_from_db_debug, limit, start)
    diagnostics["cache_after"] = {
        "supabase": {k: v for k, v in read_after_supabase.items() if k != "items"},
        "database": {k: v for k, v in read_after_db.items() if k != "items"},
    }
    diagnostics["final_items"] = read_after_supabase["items"] or read_after_db["items"] or normalized_items

    return diagnostics
