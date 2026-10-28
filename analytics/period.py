"""
商品銷售、訂單結構共用的期間：到昨天為止往前 N 天，今天還沒過完不算。
（營收總覽的 12 個月是「已經過完的 12 個月」，規則不一樣，寫在 sales_overview.py）
"""

from datetime import date, timedelta

RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90, "12m": 365}


def get_period(range_key: str, today: date) -> tuple[date, date]:
    """回傳 (開始日, 結束日)，兩天都包含在內"""
    days = RANGE_DAYS.get(range_key)
    if days is None:
        raise ValueError(f"不認識的期間：{range_key}，只能是 {', '.join(RANGE_DAYS)}")
    end = today - timedelta(days=1)
    return end - timedelta(days=days - 1), end
