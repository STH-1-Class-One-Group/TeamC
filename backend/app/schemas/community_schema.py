from pydantic import BaseModel
from typing import Optional, List, Literal


class AuthorInfo(BaseModel):
    id: str
    nickname: str
    rank: Optional[str] = None
    avatar_url: Optional[str] = None


class PostCreate(BaseModel):
    title: str
    content: str
    category: str = "general"


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None


class PostResponse(BaseModel):
    id: str
    post_number: int
    title: str
    content: str
    category: str
    views: int
    upvotes: int
    downvotes: int
    viewer_vote: Optional[Literal["up", "down"]] = None
    created_at: str
    updated_at: str
    author: AuthorInfo


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    per_page: int


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    post_id: str
    content: str
    created_at: str
    author: AuthorInfo


class PostVoteRequest(BaseModel):
    vote_type: Literal["up", "down"]


class PostVoteResponse(BaseModel):
    upvotes: int
    downvotes: int
    viewer_vote: Optional[Literal["up", "down"]] = None
