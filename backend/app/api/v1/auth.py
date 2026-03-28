# Login/Signup API
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.services.account_service import delete_current_user_account

router = APIRouter()


class AccountDeletionRequest(BaseModel):
    confirmation_text: str = Field(min_length=1, max_length=20)


class AccountDeletionResponse(BaseModel):
    success: bool = True
    message: str
    deleted_user_id: str


def _extract_token(authorization: Optional[str]) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


@router.post("/auth/me/delete", response_model=AccountDeletionResponse)
async def delete_my_account(
    body: AccountDeletionRequest,
    authorization: Optional[str] = Header(None),
):
    token = _extract_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    result = await delete_current_user_account(token, body.confirmation_text)
    return AccountDeletionResponse(**result)
