from typing import Literal, Optional

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query

from app.schemas.community_schema import CommentCreate, PostCreate, PostUpdate
from app.services import community_service

router = APIRouter()


def _extract_token(authorization: Optional[str]) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


def _require_token(authorization: Optional[str]) -> str:
    token = _extract_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    return token


@router.get("/community/posts")
async def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    search_type: Literal["title", "title_content"] = Query("title"),
):
    try:
        return await community_service.get_posts(
            page=page,
            per_page=per_page,
            category=category,
            query=query,
            search_type=search_type,
        )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.get("/community/posts/{post_id}")
async def get_post(post_id: str, background_tasks: BackgroundTasks):
    try:
        post = await community_service.get_post_detail(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
        background_tasks.add_task(community_service.increment_views, post_id)
        return post
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/community/posts", status_code=201)
async def create_post(
    body: PostCreate,
    authorization: Optional[str] = Header(None),
):
    token = _require_token(authorization)
    try:
        return await community_service.create_post(body.model_dump(), token)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.put("/community/posts/{post_id}")
async def update_post(
    post_id: str,
    body: PostUpdate,
    authorization: Optional[str] = Header(None),
):
    token = _require_token(authorization)
    try:
        return await community_service.update_post(post_id, body.model_dump(), token)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/community/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    authorization: Optional[str] = Header(None),
):
    token = _require_token(authorization)
    try:
        await community_service.delete_post(post_id, token)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/community/posts/{post_id}/comments")
async def list_comments(post_id: str):
    try:
        return await community_service.get_comments(post_id)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/community/posts/{post_id}/comments", status_code=201)
async def create_comment(
    post_id: str,
    body: CommentCreate,
    authorization: Optional[str] = Header(None),
):
    token = _require_token(authorization)
    try:
        return await community_service.create_comment(post_id, body.content, token)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.delete("/community/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: str,
    authorization: Optional[str] = Header(None),
):
    token = _require_token(authorization)
    try:
        await community_service.delete_comment(comment_id, token)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
