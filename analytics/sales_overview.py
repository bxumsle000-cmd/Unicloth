"""
銷售數據 > 營收總覽。畫面範本：sample/sales-overview.html

計算規則：
  - 只算有效訂單：排除 UNPAID（未付款）和 CANCELLED（已取消）
  - 營業額 = 商品小計 - 折扣，不含運費
  - 訂單算在下單那天（orders.created_at）。created_at 存的是台灣時間，所以「今天」直接用這台電腦的 date.today()
  - 最後一天是昨天，今天還沒過完不算
"""

import io
from datetime import date, timedelta

import pandas as pd

from db import query

# 期間選項；unit = 'day' 一天一筆，'month' 一個月一筆
RANGE_OPTIONS = {
    "7d": {"days": 7, "unit": "day"},
    "30d": {"days": 30, "unit": "day"},
    "90d": {"days": 90, "unit": "day"},
    "12m": {"months": 12, "unit": "month"},
}

METRIC_COLUMNS = ["revenue", "orders", "items", "discount"]

# 每天加總一次；件數要先在 order_items 依訂單加總，直接 JOIN 的話一張訂單有幾個品項，營業額就會被重複加幾次
DAILY_SQL = """
SELECT CAST(o.created_at AS date)   AS day,
       SUM(o.subtotal - o.discount) AS revenue,
       COUNT(*)                     AS orders,
       SUM(i.items)                 AS items,
       SUM(o.discount)              AS discount
FROM orders o
    JOIN (SELECT order_id, SUM(qty) AS items FROM order_items GROUP BY order_id) i ON i.order_id = o.id
WHERE o.status NOT IN ('UNPAID', 'CANCELLED')
  AND o.created_at >= ? AND o.created_at < ?
GROUP BY CAST(o.created_at AS date)
"""


def load_daily(start: date, end: date) -> pd.DataFrame:
    """start ～ end（含）每天一列；沒有訂單的日子補 0，不然圖上會直接跳過那天"""
    df = query(DAILY_SQL, (start, end + timedelta(days=1)))
    df["day"] = pd.to_datetime(df["day"])
    all_days = pd.date_range(start, end, freq="D", name="day")
    return df.set_index("day").reindex(all_days, fill_value=0)[METRIC_COLUMNS].astype("int64")


def summarize(df: pd.DataFrame) -> dict:
    """整段期間加總成一組指標；客單價 = 營業額 ÷ 訂單數"""
    revenue = int(df["revenue"].sum())
    orders = int(df["orders"].sum())
    return {
        "revenue": revenue,
        "orders": orders,
        "avgOrderValue": round(revenue / orders) if orders else 0,
        "items": int(df["items"].sum()),
        "discount": int(df["discount"].sum()),
    }


def to_records(df: pd.DataFrame) -> list[dict]:
    """DataFrame → [{date: '2026-10-27', revenue: ..., ...}]，給前端畫圖"""
    return [{"date": day.strftime("%Y-%m-%d"), **{col: int(row[col]) for col in METRIC_COLUMNS}}
            for day, row in df.iterrows()]


def first_order_date() -> date | None:
    """最早一張有效訂單的日期，匯出 Excel 時日期最早只能選到這天"""
    df = query("SELECT MIN(CAST(created_at AS date)) AS day FROM orders WHERE status NOT IN ('UNPAID', 'CANCELLED')")
    return df["day"].iloc[0]


def get_overview(range_key: str, today: date) -> dict:
    option = RANGE_OPTIONS.get(range_key)
    if option is None:
        raise ValueError(f"不認識的期間：{range_key}，只能是 {', '.join(RANGE_OPTIONS)}")

    if option["unit"] == "month":
        # 只算已經過完的月份，這個月還沒結束先不放，不然最後一個月會看起來掉很多
        this_month = today.replace(day=1)
        end = this_month - timedelta(days=1)
        start = (pd.Timestamp(this_month) - pd.DateOffset(months=option["months"])).date()
        previous_start = (pd.Timestamp(start) - pd.DateOffset(months=option["months"])).date()
        # 每天的資料併成每月一筆，日期是每月 1 號
        all_df = load_daily(previous_start, end).resample("MS").sum()
    else:
        end = today - timedelta(days=1)
        start = end - timedelta(days=option["days"] - 1)
        previous_start = start - timedelta(days=option["days"])
        all_df = load_daily(previous_start, end)

    current_df = all_df[all_df.index >= pd.Timestamp(start)]
    previous_df = all_df[all_df.index < pd.Timestamp(start)]
    first_date = first_order_date()
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "unit": option["unit"],
        "summary": {
            "current": summarize(current_df),
            "previous": summarize(previous_df),
        },
        "daily": to_records(current_df),
        "previousDaily": to_records(previous_df),
        # 匯出 Excel 可以選的日期範圍：最早有訂單的那天 ～ 昨天
        "minDate": first_date.isoformat() if first_date else None,
        "maxDate": (today - timedelta(days=1)).isoformat(),
    }


def export_excel(start: date, end: date) -> bytes:
    """每天一列：日期、營業額、客單價、銷售件數、折扣總額"""
    if start > end:
        raise ValueError("開始日期不能晚於結束日期")
    df = load_daily(start, end)
    # 那天沒有訂單，客單價就是 0（不然會除以 0）
    avg_order_value = (df["revenue"] / df["orders"].where(df["orders"] > 0)).round().fillna(0).astype("int64")
    sheet = pd.DataFrame({
        "日期": df.index.strftime("%Y/%m/%d"),
        "營業額": df["revenue"].to_numpy(),
        "客單價": avg_order_value.to_numpy(),
        "銷售件數": df["items"].to_numpy(),
        "折扣總額": df["discount"].to_numpy(),
    })
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        sheet.to_excel(writer, sheet_name="營收總覽", index=False)
        worksheet = writer.sheets["營收總覽"]
        worksheet.column_dimensions["A"].width = 14
        for column in "BCDE":
            worksheet.column_dimensions[column].width = 12
            for cell in worksheet[column][1:]:
                cell.number_format = "#,##0"   # 千分位
    return buffer.getvalue()
