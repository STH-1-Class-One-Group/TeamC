from fastapi import APIRouter, Query, Response, HTTPException
from typing import List, Dict
import httpx
from app.services.news_fetcher import get_defense_news

router = APIRouter()

@router.get("/news", response_model=List[Dict])
async def fetch_defense_news(
    limit: int = Query(4, ge=1, le=100),
    start: int = Query(1, ge=1, le=1000),
):
    """
    국방 관련 뉴스를 가져옵니다.
    """
    return await get_defense_news(limit=limit, start=start)

@router.get("/news/image")
async def proxy_news_image(url: str):
    """
    네이버 뉴스 썸네일 이미지에 대한 CORS 우회용 프록시 API.
    """
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
        
    async with httpx.AsyncClient() as client:
        try:
            # 원본 URL로부터 이미지를 가져옵니다.
            # 네이버 CDN이 Referer나 User-Agent를 검사할 수 있으므로 일부 브라우저 헤더를 모방할 수 있습니다.
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://openapi.naver.com/"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            # StreamingResponse 또는 Response 객체로 반환
            return Response(
                content=response.content,
                media_type=response.headers.get("Content-Type", "image/jpeg")
            )
        except Exception as e:
            print(f"Proxy image error: {e}")
            raise HTTPException(status_code=502, detail="Failed to fetch image from external source")
