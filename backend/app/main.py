# FastAPI app initialization
import logging
import re

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.community import router as community_router
from app.api.v1.meal import router as meal_router
from app.api.v1.news import router as news_router
from app.core.config import settings
from app.services import community_service
from app.services.news_fetcher import close_news_http_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(
    title="TeamC Backend API",
    description="군대 소식 기반 웹사이트 백엔드 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def normalize_request_path(request, call_next):
    original_path = request.scope.get("path", "")
    normalized_path = re.sub(r"/{2,}", "/", original_path) or "/"

    if normalized_path != original_path:
        request.scope["path"] = normalized_path
        raw_path = request.scope.get("raw_path")
        if raw_path:
            normalized_raw_path = re.sub(r"/{2,}", "/", raw_path.decode("latin-1"))
            request.scope["raw_path"] = normalized_raw_path.encode("latin-1")

    return await call_next(request)


app.include_router(meal_router, prefix="/api/v1", tags=["meals"])
app.include_router(news_router, prefix="/api/v1", tags=["news"])
app.include_router(community_router, prefix="/api/v1", tags=["community"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled server error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/")
def root():
    return {"message": "TeamC Backend API is running"}


@app.on_event("shutdown")
async def shutdown_event():
    await community_service.close_http_client()
    await close_news_http_client()
