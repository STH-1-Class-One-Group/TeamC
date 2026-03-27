from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, Request, Response
from pydantic import BaseModel

from app.services.news_bookmarks import (
    create_news_bookmark,
    delete_news_bookmark,
    list_news_bookmarks,
)
from app.services.news_fetcher import debug_defense_news, get_defense_news

router = APIRouter()


class BookmarkNewsPayload(BaseModel):
    id: Optional[str] = None
    title: str
    link: str
    pubDate: Optional[str] = ""
    thumbnail: Optional[str] = ""


class BookmarkCreateRequest(BaseModel):
    news_id: Optional[str] = None
    news: Optional[BookmarkNewsPayload] = None


@router.get("/news", response_model=List[Dict])
async def fetch_defense_news(
    request: Request,
    limit: int = Query(4, ge=1, le=100),
    start: int = Query(1, ge=1, le=1000),
    force_refresh: bool = Query(False),
):
    return await get_defense_news(
        limit=limit,
        start=start,
        force_refresh=force_refresh,
        user_authorization=request.headers.get("Authorization"),
    )


@router.get("/news/debug", response_model=Dict[str, Any])
async def fetch_defense_news_debug(
    request: Request,
    limit: int = Query(4, ge=1, le=30),
    start: int = Query(1, ge=1, le=1000),
    force_refresh: bool = Query(True),
):
    return await debug_defense_news(
        limit=limit,
        start=start,
        force_refresh=force_refresh,
        user_authorization=request.headers.get("Authorization"),
    )


@router.get("/news/bookmarks", response_model=List[Dict[str, Any]])
async def fetch_news_bookmarks(request: Request):
    return await list_news_bookmarks(request.headers.get("Authorization"))


@router.post("/news/bookmarks", response_model=Dict[str, Any])
async def save_news_bookmark(request: Request, payload: BookmarkCreateRequest):
    return await create_news_bookmark(
        news_id=payload.news_id,
        news=(
            payload.news.model_dump()
            if payload.news and hasattr(payload.news, "model_dump")
            else payload.news.dict()
            if payload.news
            else None
        ),
        user_authorization=request.headers.get("Authorization"),
    )


@router.delete("/news/bookmarks/{news_id}", response_model=Dict[str, bool])
async def remove_news_bookmark(request: Request, news_id: str):
    return await delete_news_bookmark(
        news_id=news_id,
        user_authorization=request.headers.get("Authorization"),
    )


@router.get("/news/image")
async def proxy_news_image(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=2.0)) as client:
        try:
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                "Referer": "https://openapi.naver.com/",
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            return Response(
                content=response.content,
                media_type=response.headers.get("Content-Type", "image/jpeg"),
            )
        except Exception as error:
            print(f"Proxy image error: {error}")
            raise HTTPException(status_code=502, detail="Failed to fetch image from external source")
