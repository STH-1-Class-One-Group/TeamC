from fastapi import APIRouter
from typing import List, Dict
from app.services.news_fetcher import get_defense_news

router = APIRouter()

@router.get("/news", response_model=List[Dict])
async def fetch_defense_news():
    """
    국방 관련 뉴스를 가져옵니다.
    """
    return await get_defense_news()
