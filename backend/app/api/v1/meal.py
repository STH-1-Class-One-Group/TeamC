# Meal data API
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import List

from app.services.meal_fetcher import fetch_all_meals, filter_meals_by_date
from app.schemas.meal_schema import MealItem, MealResponse

router = APIRouter()

# 오늘 날짜에 해당하는 데이터가 없을 때 사용할 기본 데이터 (dates는 동적으로 바뀜)
FALLBACK_DATA = [
    {"dates": "", "brst": "밥", "brst_cal": "374.13kcal", "lnch": "밥", "lnch_cal": "374.13kcal", "dnr": "밥", "dnr_cal": "374.13kcal", "sum_cal": "2961.19kcal"},
    {"dates": "", "brst": "참치 고추장찌개(05)(06)(09)(16)", "brst_cal": "148.73kcal", "lnch": "황태채미역국(05)(06)(16)", "lnch_cal": "41.88kcal", "dnr": "닭볶음탕(05)(15)", "dnr_cal": "451.14kcal", "sum_cal": "2961.19kcal"},
    {"dates": "", "brst": "새송이버섯야채볶음(05)(06)(10)(18)", "brst_cal": "111.5kcal", "lnch": "사천식캐슈넛멸치볶음(04)(05)", "lnch_cal": "102.06kcal", "dnr": "사골우거지국(02)(05)(06)(16)(18)", "dnr_cal": "164.58kcal", "sum_cal": "2961.19kcal"},
    {"dates": "", "brst": "계란말이(완)(01)(05)(12)", "brst_cal": "106kcal", "lnch": "고추장돼지불고기(완제품)(05)(10)", "lnch_cal": "482.33kcal", "dnr": "느타리버섯볶음(05)", "dnr_cal": "37.98kcal", "sum_cal": "2961.19kcal"},
    {"dates": "", "brst": "배추김치(수의계약)", "brst_cal": "13.8kcal", "lnch": "배추김치(수의계약)", "lnch_cal": "13.8kcal", "dnr": "토핑형발효유(02)(06)", "dnr_cal": "165kcal", "sum_cal": "2961.19kcal"},
    {"dates": "", "brst": "", "brst_cal": "", "lnch": "", "lnch_cal": "", "dnr": "배추김치", "dnr_cal": "0kcal", "sum_cal": "2961.19kcal"},
]


def _get_date_with_day(date_str: str) -> str:
    """'YYYY-MM-DD' 형식을 받아서 'YYYY-MM-DD(요일)' 형식으로 반환"""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        days_kr = ["월", "화", "수", "목", "금", "토", "일"]
        day_name = days_kr[dt.weekday()]
        return f"{date_str}({day_name})"
    except Exception:
        return date_str


def _apply_fallback(date_display: str) -> MealResponse:
    """fallback 데이터에 날짜를 적용하여 반환"""
    data = []
    for item in FALLBACK_DATA:
        new_item = item.copy()
        new_item["dates"] = date_display
        data.append(MealItem(**new_item))

    return MealResponse(
        success=True,
        date=date_display,
        data=data,
        is_fallback=True
    )


@router.get("/meals", response_model=MealResponse)
async def get_all_meals():
    """전체 식단 데이터를 반환합니다."""
    meals = await fetch_all_meals()

    if meals is None:
        today_display = _get_date_with_day(datetime.now().strftime("%Y-%m-%d"))
        return _apply_fallback(today_display)

    return MealResponse(
        success=True,
        date="all",
        data=[MealItem(**meal) for meal in meals]
    )


@router.get("/meals/{date}", response_model=MealResponse)
async def get_meals_by_date(date: str):
    """
    특정 날짜의 식단 데이터를 반환합니다.
    date 형식: YYYY-MM-DD (예: 2026-03-23)
    """
    date_display = _get_date_with_day(date)
    meals = await fetch_all_meals()

    # KV 데이터를 가져오지 못했거나 에러가 난 경우
    if meals is None:
        return _apply_fallback(date_display)

    # 날짜로 필터링 (dates가 '2026-03-23(월)' 형식이므로 startswith로 비교)
    filtered = filter_meals_by_date(meals, date)

    # 해당 날짜 데이터가 없는 경우
    if not filtered:
        return _apply_fallback(date_display)

    return MealResponse(
        success=True,
        date=date_display,
        data=[MealItem(**meal) for meal in filtered]
    )
