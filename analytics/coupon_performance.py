"""
銷售數據 > 折價券成效。畫面範本：sample/coupon-performance.html

計算規則：
  - 期間是到昨天為止往前 N 天
  - 發出的券依發券時間（received_at）：這段期間發出的券，現在用掉幾張、還能用幾張、過期幾張
    券的狀態跟後端 MemberCouponStatus.of() 一樣：有 used_at → 已使用；沒用、過了 expire_at → 已過期；其他 → 可使用
  - 訂單依下單時間（created_at），只算有效訂單（排除 UNPAID、CANCELLED）
  - 營業額 = 商品小計 - 折扣，不含運費；折扣成本加總 = 營收總覽的折扣總額
"""

from datetime import datetime, timedelta

import pandas as pd

from db import query
from period import get_period

COUPON_SQL = "SELECT id, code, title, type, value, min_subtotal, auto_trigger, is_active FROM coupons"

ISSUED_SQL = """
SELECT coupon_id, received_at, expire_at, used_at
FROM member_coupons
WHERE received_at >= ? AND received_at < ?
"""

# 有效訂單；用券的接回是哪一種券
ORDER_SQL = """
SELECT o.discount, o.subtotal - o.discount AS revenue, mc.coupon_id
FROM orders o
    LEFT JOIN member_coupons mc ON mc.id = o.member_coupon_id
WHERE o.status NOT IN ('UNPAID', 'CANCELLED')
  AND o.created_at >= ? AND o.created_at < ?
"""


def get_coupon_performance(range_key: str, now: datetime) -> dict:
    start, end = get_period(range_key, now.date())
    params = (start, end + timedelta(days=1))

    coupon_df = query(COUPON_SQL).set_index("id")
    issued_df = query(ISSUED_SQL, params)
    issued_df["status"] = "USABLE"
    issued_df.loc[pd.to_datetime(issued_df["expire_at"]) < pd.Timestamp(now), "status"] = "EXPIRED"
    issued_df.loc[issued_df["used_at"].notna(), "status"] = "USED"

    order_df = query(ORDER_SQL, params)
    coupon_order_df = order_df[order_df["coupon_id"].notna()]

    total_revenue = int(order_df["revenue"].sum())
    coupon_discount = int(coupon_order_df["discount"].sum())
    coupon_revenue = int(coupon_order_df["revenue"].sum())
    status_count = issued_df["status"].value_counts()

    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "coupon": {
            "issued": len(issued_df),
            "used": int(status_count.get("USED", 0)),
            "usable": int(status_count.get("USABLE", 0)),
            "couponRevenue": coupon_revenue,
            "totalRevenue": total_revenue,
            "discount": coupon_discount,
            "couponOrders": len(coupon_order_df),
            "avgDiscount": round(coupon_discount / len(coupon_order_df)) if len(coupon_order_df) else None,
        },
        "couponList": coupon_rows(coupon_df, issued_df, coupon_order_df),
        "compareList": compare_rows(order_df),
    }


def coupon_rows(coupon_df: pd.DataFrame, issued_df: pd.DataFrame, coupon_order_df: pd.DataFrame) -> list[dict]:
    """每張券一列：發券、使用率用這段期間發出的券；訂單數、營業額、折扣用這段期間用這張券的有效訂單。依營業額排序"""
    issued_count = issued_df.groupby(["coupon_id", "status"]).size().unstack(fill_value=0)
    order_summary = coupon_order_df.groupby("coupon_id").agg(
        orders=("revenue", "size"), revenue=("revenue", "sum"), discount=("discount", "sum"))

    row_list = []
    for coupon_id, coupon in coupon_df.iterrows():
        issued = int(issued_count.loc[coupon_id].sum()) if coupon_id in issued_count.index else 0
        used = int(issued_count.loc[coupon_id].get("USED", 0)) if coupon_id in issued_count.index else 0
        orders = int(order_summary.loc[coupon_id, "orders"]) if coupon_id in order_summary.index else 0
        # 這段期間沒發、也沒人用的券不列出來
        if issued == 0 and orders == 0:
            continue
        revenue = int(order_summary.loc[coupon_id, "revenue"]) if orders else 0
        discount = int(order_summary.loc[coupon_id, "discount"]) if orders else 0
        row_list.append({
            "id": int(coupon_id),
            "code": coupon["code"],
            "title": coupon["title"],
            "type": coupon["type"],
            "value": int(coupon["value"]),
            "minSubtotal": int(coupon["min_subtotal"]),
            "autoTrigger": coupon["auto_trigger"] if pd.notna(coupon["auto_trigger"]) else None,   # 手動發的券沒有，pandas 會變成 NaN
            "isActive": bool(coupon["is_active"]),
            "issued": issued,
            "used": used,
            "useRate": round(used / issued * 100, 1) if issued else None,
            "orders": orders,
            "revenue": revenue,
            "discount": discount,
            "avgDiscount": round(discount / orders) if orders else None,
        })
    return sorted(row_list, key=lambda row: row["revenue"], reverse=True)


def compare_rows(order_df: pd.DataFrame) -> list[dict]:
    """有用券、沒用券的訂單：訂單數、佔比、營業額、平均折扣、客單價"""
    total_orders = len(order_df)
    row_list = []
    for name, group_df in [("有用券", order_df[order_df["coupon_id"].notna()]),
                           ("沒用券", order_df[order_df["coupon_id"].isna()])]:
        orders = len(group_df)
        revenue = int(group_df["revenue"].sum())
        row_list.append({
            "name": name,
            "orders": orders,
            "orderPercent": round(orders / total_orders * 100, 1) if total_orders else None,
            "revenue": revenue,
            "avgDiscount": round(int(group_df["discount"].sum()) / orders) if orders else None,
            "aov": round(revenue / orders) if orders else None,
        })
    return row_list
