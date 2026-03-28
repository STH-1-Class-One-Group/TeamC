import logging
from typing import Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


logger = logging.getLogger(__name__)

ACCOUNT_DELETION_CONFIRMATION_TEXT = "회원탈퇴"
REST_TABLE_CLEANUP_TARGETS = (
    ("bookmarks_news", "user_id"),
    ("cart_items", "user_id"),
    ("user_coupons", "user_id"),
    ("orders", "user_id"),
    ("profiles", "id"),
)


def _require_supabase_account_deletion_config() -> None:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase 설정이 없어 회원 탈퇴를 처리할 수 없습니다.",
        )

    if not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="service role key가 없어 회원 탈퇴를 처리할 수 없습니다.",
        )


def _get_user_headers(token: str) -> dict[str, str]:
    return {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {token}",
    }


def _get_service_headers() -> dict[str, str]:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }


def _is_missing_relation_response(response: httpx.Response) -> bool:
    if response.status_code == 404:
        return True

    try:
        payload = response.json()
    except ValueError:
        return False

    message = str(payload.get("message", "")).lower()
    code = str(payload.get("code", "")).upper()
    details = str(payload.get("details", "")).lower()

    return code == "PGRST205" or "relation" in message and "does not exist" in message or (
        "relation" in details and "does not exist" in details
    )


async def _get_current_user(token: str, client: httpx.AsyncClient) -> dict:
    response = await client.get(
        f"{settings.supabase_url}/auth/v1/user",
        headers=_get_user_headers(token),
    )

    if response.status_code in (401, 403):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.exception("Failed to verify current user before deletion")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="회원 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
        ) from exc

    payload = response.json()
    if not payload.get("id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인 정보를 확인하지 못했습니다.",
        )

    return payload


async def _delete_rows_if_present(
    client: httpx.AsyncClient,
    table_name: str,
    column_name: str,
    user_id: str,
) -> None:
    response = await client.delete(
        f"{settings.supabase_url}/rest/v1/{table_name}",
        headers={**_get_service_headers(), "Prefer": "return=minimal"},
        params={column_name: f"eq.{user_id}"},
    )

    if response.status_code in (200, 204):
        return

    if _is_missing_relation_response(response):
        logger.info("Skipping deletion for missing table: %s", table_name)
        return

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.exception("Failed to delete rows for table %s", table_name)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{table_name} 데이터를 정리하지 못했습니다.",
        ) from exc


async def _delete_auth_user(client: httpx.AsyncClient, user_id: str) -> None:
    response = await client.delete(
        f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
        headers=_get_service_headers(),
    )

    if response.status_code in (200, 204):
        return

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.exception("Failed to delete auth user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="인증 계정을 삭제하지 못했습니다.",
        ) from exc


async def delete_current_user_account(token: str, confirmation_text: Optional[str]) -> dict[str, str]:
    _require_supabase_account_deletion_config()

    if (confirmation_text or "").strip() != ACCOUNT_DELETION_CONFIRMATION_TEXT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'"{ACCOUNT_DELETION_CONFIRMATION_TEXT}"를 정확히 입력해주세요.',
        )

    timeout = httpx.Timeout(20.0, connect=5.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        user = await _get_current_user(token, client)
        user_id = str(user["id"])

        for table_name, column_name in REST_TABLE_CLEANUP_TARGETS:
            await _delete_rows_if_present(client, table_name, column_name, user_id)

        await _delete_auth_user(client, user_id)

    return {
        "deleted_user_id": user_id,
        "message": "회원 탈퇴가 완료되었습니다.",
    }
