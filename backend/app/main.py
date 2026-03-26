# FastAPI app initialization
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.meal import router as meal_router
from app.api.v1.news import router as news_router
from app.api.v1.community import router as community_router
from app.services import community_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(
    title="TeamC Backend API",
    description="군대 음식 기반 웹사이트 백엔드 API",
    version="1.0.0"
)

# CORS 설정 - 프론트엔드에서의 요청 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # React dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(meal_router, prefix="/api/v1", tags=["meals"])
app.include_router(news_router, prefix="/api/v1", tags=["news"])
app.include_router(community_router, prefix="/api/v1", tags=["community"])


@app.get("/")
def root():
    return {"message": "TeamC Backend API is running"}


@app.on_event("shutdown")
async def shutdown_event():
    await community_service.close_http_client()
