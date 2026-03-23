# FastAPI app initialization
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.meal import router as meal_router

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


@app.get("/")
def root():
    return {"message": "TeamC Backend API is running"}
