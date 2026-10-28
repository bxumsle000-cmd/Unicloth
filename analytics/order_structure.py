"""
銷售數據 > 訂單結構。畫面範本：sample/order-structure.html

計算規則：
  - 期間內「下的」全部訂單（依 created_at），含未付款、已取消；期間是到昨天為止往前 N 天
  - 配送方式、付款方式只算有效訂單（排除 UNPAID、CANCELLED），跟營收總覽一樣
  - 訂單成立時間：信用卡、ATM 用 paid_at；貨到付款用 created_at（它的 paid_at 是送達收錢的時間）
  - 可以用配送方式（HOME / CVS）篩選；配送方式圖本身是篩選器，不受篩選影響
"""

from datetime import date, datetime, timedelta

import pandas as pd

from db import query
from period import get_period

# 畫面上顯示的中文，跟後端 enum 的 label 一樣；照這個順序排
SHIPPING_LABEL = {"HOME": "宅配", "CVS": "超商取貨"}
PAYMENT_LABEL = {"CREDIT": "信用卡", "ATM": "ATM 轉帳", "COD": "貨到付款"}
STATUS_LABEL = {   # 照訂單流程排
    "UNPAID": "未付款",
    "PENDING": "訂單確認中",
    "SHIPPED": "已出貨",
    "DELIVERED": "已送達",
    "PICKED_UP": "取貨完畢",
    "CANCELLED": "已取消",
}
INVALID_STATUS_LIST = ["UNPAID", "CANCELLED"]

SHIP_DAYS_LABEL_LIST = ["當天", "1 天", "2 天", "3 天", "4 天", "5 天以上"]
LATE_DAYS = 3   # 訂單成立超過幾天還沒出貨，算「待出貨太久」

ORDER_COLUMNS = "payment_method, shipping_method, status, created_at, paid_at, shipped_at, delivered_at, completed_at"
ORDER_SQL = f"SELECT {ORDER_COLUMNS} FROM orders WHERE created_at >= ? AND created_at < ?"
PENDING_SQL = f"SELECT {ORDER_COLUMNS} FROM orders WHERE status = 'PENDING'"


def load_orders(sql: str, params: tuple = ()) -> pd.DataFrame:
    df = query(sql, params)
    for column in ["created_at", "paid_at", "shipped_at", "delivered_at", "completed_at"]:
        df[column] = pd.to_datetime(df[column])
    # 訂單成立時間：貨到付款看下單時間，其他看付款時間
    df["confirmed_at"] = df["created_at"].where(df["payment_method"] == "COD", df["paid_at"])
    return df


def days_between(start: pd.Series, end: pd.Series) -> pd.Series:
    """兩個時間差幾天（有小數，例如 1.5 天）"""
    return (end - start).dt.total_seconds() / 86400


def get_order_structure(range_key: str, now: datetime, shipping: str | None) -> dict:
    start, end = get_period(range_key, now.date())
    if shipping is not None and shipping not in SHIPPING_LABEL:
        raise ValueError(f"不認識的配送方式：{shipping}，只能是 {', '.join(SHIPPING_LABEL)}")

    order_df = load_orders(ORDER_SQL, (start, end + timedelta(days=1)))
    # 篩選後的資料：除了配送方式圖，其他區塊都用這份
    filtered_df = order_df if shipping is None else order_df[order_df["shipping_method"] == shipping]
    valid_mask = ~order_df["status"].isin(INVALID_STATUS_LIST)
    filtered_valid_df = filtered_df[~filtered_df["status"].isin(INVALID_STATUS_LIST)]

    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "filter": {"shipping": {"key": shipping, "name": SHIPPING_LABEL[shipping]} if shipping else None},
        "kpi": kpi(filtered_df, now, shipping),
        "shippingList": count_list(order_df[valid_mask], "shipping_method", SHIPPING_LABEL),
        "paymentList": count_list(filtered_valid_df, "payment_method", PAYMENT_LABEL),
        "statusList": count_list(filtered_df, "status", STATUS_LABEL),
        "shipSpeedList": ship_speed(filtered_df),
        "deliverList": deliver_days(filtered_df, shipping),
        "cancelList": cancel_rows(filtered_df),
    }


def kpi(df: pd.DataFrame, now: datetime, shipping: str | None) -> dict:
    shipped_df = df[df["shipped_at"].notna() & df["confirmed_at"].notna()]
    ship_days = days_between(shipped_df["confirmed_at"], shipped_df["shipped_at"])

    # 待出貨太久：不看期間，看「現在」所有訂單確認中的訂單；有篩選配送方式也跟著篩
    pending_df = load_orders(PENDING_SQL)
    if shipping is not None:
        pending_df = pending_df[pending_df["shipping_method"] == shipping]
    late_count = int((pd.Timestamp(now) - pending_df["confirmed_at"] > pd.Timedelta(days=LATE_DAYS)).sum())

    return {
        "orders": len(df),
        # 沒有訂單就沒辦法算比例，回 None，畫面顯示 —
        "cancelRate": round((df["status"] == "CANCELLED").sum() / len(df) * 100, 1) if len(df) else None,
        "avgShipDays": round(float(ship_days.mean()), 1) if len(ship_days) else None,
        "latePending": late_count,
    }


def count_list(df: pd.DataFrame, column: str, label_map: dict) -> list[dict]:
    """依某個欄位數筆數，照 label_map 的順序排（沒有的也列出來，0 筆）"""
    counts = df[column].value_counts()
    return [{"key": key, "name": name, "count": int(counts.get(key, 0))} for key, name in label_map.items()]


def ship_speed(df: pd.DataFrame) -> list[dict]:
    """出貨天數分布：訂單成立 → 出貨，當天、1 天……5 天以上各幾筆"""
    shipped_df = df[df["shipped_at"].notna() & df["confirmed_at"].notna()]
    days = days_between(shipped_df["confirmed_at"], shipped_df["shipped_at"]).clip(lower=0) // 1
    counts = days.clip(upper=len(SHIP_DAYS_LABEL_LIST) - 1).value_counts()
    return [{"name": label, "count": int(counts.get(index, 0))} for index, label in enumerate(SHIP_DAYS_LABEL_LIST)]


def deliver_days(df: pd.DataFrame, shipping: str | None) -> list[dict]:
    """配送天數：宅配看出貨 → 送達；超商看出貨 → 到店、到店 → 取貨。有篩選配送方式時只給那一種"""
    item_list = [
        ("HOME", "宅配：出貨 → 送達", "已送達", "shipped_at", "delivered_at"),
        ("CVS", "超商：出貨 → 到店", "已到店", "shipped_at", "delivered_at"),
        ("CVS", "超商：到店 → 取貨", "已取貨", "delivered_at", "completed_at"),
    ]
    result = []
    for item_shipping, name, unit, from_column, to_column in item_list:
        if shipping is not None and item_shipping != shipping:
            continue
        item_df = df[(df["shipping_method"] == item_shipping) & df[from_column].notna() & df[to_column].notna()]
        days = days_between(item_df[from_column], item_df[to_column])
        result.append({
            "name": name,
            "unit": unit,
            "avgDays": round(float(days.mean()), 1) if len(days) else None,
            "count": len(days),
        })
    return result


def cancel_rows(df: pd.DataFrame) -> list[dict]:
    """
    取消分析，每一列是「付款方式 + 取消原因」；取消率 = 已取消 ÷ 下單數
    「還沒有結果」= 還不知道會不會被取消的訂單
    資料庫沒有記錄取消原因，用付款狀態分辨：
      - 沒付款就被取消（paid_at 是空的）→ 未付款取消（逾時被排程取消，或顧客自己取消）
      - 已付款、或貨到付款被取消 → 出貨前由後台取消（後台只能取消「訂單確認中」的訂單）
    """
    cancelled = df["status"] == "CANCELLED"
    row_list = [
        {"name": "信用卡", "reason": "未付款（30 分鐘）",
         "mask": df["payment_method"] == "CREDIT", "cancelled": df["paid_at"].isna(), "waiting": ["UNPAID"]},
        {"name": "ATM 轉帳", "reason": "未付款（4 天）",
         "mask": df["payment_method"] == "ATM", "cancelled": df["paid_at"].isna(), "waiting": ["UNPAID"]},
        {"name": "全部付款方式", "reason": "出貨前由後台取消",
         "mask": pd.Series(True, index=df.index),
         "cancelled": df["paid_at"].notna() | (df["payment_method"] == "COD"), "waiting": ["PENDING"]},
    ]
    result = []
    for row in row_list:
        row_df = df[row["mask"]]
        cancelled_count = int((cancelled & row["mask"] & row["cancelled"]).sum())
        result.append({
            "name": row["name"],
            "reason": row["reason"],
            "orders": len(row_df),
            "cancelled": cancelled_count,
            "waiting": int(row_df["status"].isin(row["waiting"]).sum()),
            "cancelRate": round(cancelled_count / len(row_df) * 100, 1) if len(row_df) else None,
        })
    return result
