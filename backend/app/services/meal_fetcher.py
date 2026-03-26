# External API fetcher - Cloudflare KV REST API
import httpx
import json
from typing import List, Optional
from app.core.config import settings


import time

# Cloudflare KV REST API 기본 URL
CF_KV_BASE_URL = "https://api.cloudflare.com/client/v4/accounts/{account_id}/storage/kv/namespaces/{namespace_id}/values/{key_name}"

# Simple In-memory cache
_meal_cache: Optional[List[dict]] = None
_meal_cache_time: float = 0
CACHE_TTL = 300  # 5 minutes


async def fetch_all_meals() -> Optional[List[dict]]:
    """
    Cloudflare KV에서 전체 식단 데이터를 가져옵니다.
    KV key 이름: 'meals' (바인딩 이름과 동일)
    캐싱을 적용하여 외부 요청 횟수를 줄입니다.
    """
    global _meal_cache, _meal_cache_time

    # Check cache
    current_time = time.time()
    if _meal_cache is not None and (current_time - _meal_cache_time) < CACHE_TTL:
        return _meal_cache

    account_id = settings.cf_account_id
    namespace_id = settings.cf_kv_namespace_id
    api_token = settings.cf_api_token

    if not all([account_id, namespace_id, api_token]):
        print("[meal_fetcher] Cloudflare KV 환경 변수가 설정되지 않았습니다.")
        return None

    url = CF_KV_BASE_URL.format(
        account_id=account_id,
        namespace_id=namespace_id,
        key_name="meals"
    )

    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            # KV values 엔드포인트는 값 자체를 직접 반환합니다
            data = response.json()

            # DATA 배열이 있는 경우와 배열 자체인 경우 모두 처리
            meals_result = None
            if isinstance(data, dict) and "DATA" in data:
                meals_result = data["DATA"]
            elif isinstance(data, list):
                meals_result = data
            
            if meals_result is not None:
                _meal_cache = meals_result
                _meal_cache_time = time.time()
                return meals_result
            else:
                print(f"[meal_fetcher] 예상치 못한 데이터 형식: {type(data)}")
                return None

    except httpx.HTTPStatusError as e:
        print(f"[meal_fetcher] HTTP 오류: {e.response.status_code} - {e.response.text}")
        return None
    except httpx.RequestError as e:
        print(f"[meal_fetcher] 요청 오류: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"[meal_fetcher] JSON 파싱 오류: {e}")
        return None


def filter_meals_by_date(meals: List[dict], target_date: str) -> List[dict]:
    """
    식단 데이터에서 특정 날짜에 해당하는 항목들을 필터링합니다.
    target_date 형식: '2026-03-23' → '2026-03-23(월)' 처럼 dates 필드에서 날짜 부분만 매칭
    """
    filtered = []
    for meal in meals:
        dates_value = meal.get("dates", "")
        # dates 필드가 '2026-03-23(월)' 형태이므로 앞 10자리(날짜 부분)만 비교
        if dates_value.startswith(target_date):
            filtered.append(meal)
    return filtered
