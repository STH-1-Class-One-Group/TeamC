from fastapi import APIRouter, HTTPException, Query, Header
from typing import Literal, Optional
from app.schemas.community_schema import PostCreate, PostUpdate, CommentCreate
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


# ────────────────────────────────────────────────────────────
# 게시글 목록
# ────────────────────────────────────────────────────────────
@router.get("/community/posts")
async def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    search_type: Literal["title", "title_content"] = Query("title"),
):
    """게시글 목록 조회 (비로그인 허용)."""
    return await community_service.get_posts(
        page=page,
        per_page=per_page,
        category=category,
        query=query,
        search_type=search_type,
    )


# ────────────────────────────────────────────────────────────
# 게시글 상세
# ────────────────────────────────────────────────────────────
@router.get("/community/posts/{post_id}")
async def get_post(post_id: str):
    """게시글 상세 조회 (비로그인 허용)."""
    post = await community_service.get_post_detail(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return post


@router.post("/community/posts/{post_id}/views", status_code=204)
async def increment_post_views(post_id: str):
    """게시글 조회수 증가."""
    post = await community_service.get_post_detail(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    await community_service.increment_views(post_id)


# ────────────────────────────────────────────────────────────
# 게시글 작성
# ────────────────────────────────────────────────────────────
@router.post("/community/posts", status_code=201)
async def create_post(
    body: PostCreate,
    authorization: Optional[str] = Header(None),
):
    """게시글 작성 (로그인 필요)."""
    token = _require_token(authorization)
    try:
        return await community_service.create_post(body.model_dump(), token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ────────────────────────────────────────────────────────────
# 게시글 수정
# ────────────────────────────────────────────────────────────
@router.put("/community/posts/{post_id}")
async def update_post(
    post_id: str,
    body: PostUpdate,
    authorization: Optional[str] = Header(None),
):
    """게시글 수정 (로그인 + 본인만, RLS 적용)."""
    token = _require_token(authorization)
    try:
        return await community_service.update_post(post_id, body.model_dump(), token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ────────────────────────────────────────────────────────────
# 게시글 삭제
# ────────────────────────────────────────────────────────────
@router.delete("/community/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    authorization: Optional[str] = Header(None),
):
    """게시글 삭제 (로그인 + 본인만, RLS 적용)."""
    token = _require_token(authorization)
    try:
        await community_service.delete_post(post_id, token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ────────────────────────────────────────────────────────────
# 댓글 목록
# ────────────────────────────────────────────────────────────
@router.get("/community/posts/{post_id}/comments")
async def list_comments(post_id: str):
    """댓글 목록 조회 (비로그인 허용)."""
    return await community_service.get_comments(post_id)


# ────────────────────────────────────────────────────────────
# 댓글 작성
# ────────────────────────────────────────────────────────────
@router.post("/community/posts/{post_id}/comments", status_code=201)
async def create_comment(
    post_id: str,
    body: CommentCreate,
    authorization: Optional[str] = Header(None),
):
    """댓글 작성 (로그인 필요)."""
    token = _require_token(authorization)
    try:
        return await community_service.create_comment(post_id, body.content, token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ────────────────────────────────────────────────────────────
# 댓글 삭제
# ────────────────────────────────────────────────────────────
@router.delete("/community/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: str,
    authorization: Optional[str] = Header(None),
):
    """댓글 삭제 (로그인 + 본인만, RLS 적용)."""
    token = _require_token(authorization)
    try:
        await community_service.delete_comment(comment_id, token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
