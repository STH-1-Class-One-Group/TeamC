# Meal Pydantic schemas
from pydantic import BaseModel
from typing import Optional, List


class MealItem(BaseModel):
    """개별 식단 데이터 항목 (다양한 필드명 대응)"""
    dates: str
    brst: Optional[str] = ""
    brst_cal: Optional[str] = ""
    lnch: Optional[str] = ""      # 점심 1
    lunc: Optional[str] = ""      # 점심 2
    lnch_cal: Optional[str] = ""
    lunc_cal: Optional[str] = ""
    dnr: Optional[str] = ""       # 저녁 1
    dinr: Optional[str] = ""      # 저녁 2
    dnr_cal: Optional[str] = ""
    dinr_cal: Optional[str] = ""
    sum_cal: Optional[str] = ""


class MealResponse(BaseModel):
    """식단 API 응답 모델"""
    success: bool
    date: str
    data: List[MealItem]
    is_fallback: bool = False
