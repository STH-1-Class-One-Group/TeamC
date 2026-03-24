import httpx
from typing import List, Optional, Dict
from app.core.config import settings

NAVER_NEWS_API_URL = "https://openapi.naver.com/v1/search/news.json"
NAVER_IMAGE_API_URL = "https://openapi.naver.com/v1/search/image"

async def fetch_naver_news(query: str, display: int = 4) -> List[Dict]:
    """
    네이버 뉴스 검색 API를 호출합니다.
    """
    headers = {
        "X-Naver-Client-Id": settings.naver_client_id,
        "X-Naver-Client-Secret": settings.naver_client_secret
    }
    params = {
        "query": query,
        "display": display,
        "sort": "sim"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(NAVER_NEWS_API_URL, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("items", [])
        except Exception as e:
            print(f"Error fetching news: {e}")
            return []

async def fetch_news_thumbnail(title: str) -> Optional[str]:
    """
    네이버 이미지 검색 API를 호출하여 뉴스 썸네일을 가져옵니다.
    """
    headers = {
        "X-Naver-Client-Id": settings.naver_client_id,
        "X-Naver-Client-Secret": settings.naver_client_secret
    }
    params = {
        "query": title,
        "display": 1,
        "sort": "sim"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(NAVER_IMAGE_API_URL, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            items = data.get("items", [])
            if items:
                return items[0].get("link")
            return None
        except Exception as e:
            print(f"Error fetching image for title '{title}': {e}")
            return None

async def get_defense_news() -> List[Dict]:
    """
    국방 관련 뉴스와 썸네일을 가져옵니다.
    """
    query = "국방 OR \"방위산업\" OR \"K-방산\""
    news_items = await fetch_naver_news(query)

    results = []
    for item in news_items:
        # 뉴스 제목에서 HTML 태그 제거
        clean_title = item.get("title", "").replace("<b>", "").replace("</b>", "").replace("&quot;", "\"").replace("&amp;", "&")
        
        # 썸네일 가져오기
        thumbnail = await fetch_news_thumbnail(clean_title)
        
        results.append({
            "title": clean_title,
            "link": item.get("link"),
            "pubDate": item.get("pubDate"),
            "thumbnail": thumbnail or "https://via.placeholder.com/300x200?text=No+Image"
        })
        
    return results
