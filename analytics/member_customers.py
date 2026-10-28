"""
銷售數據 > 會員與顧客。畫面範本：sample/member-customers.html

計算規則：
  - 期間內有有效訂單（排除 UNPAID、CANCELLED）的會員才算「下單會員」；期間是到昨天為止往前 N 天
  - 消費金額 = 商品小計 - 折扣，不含運費（跟營收總覽一樣）
  - 新客：第一筆有效訂單在這段期間內；回購客：這段期間之前就買過（用全部訂單判斷，不受期間影響）
  - 年齡由生日換算成今天的年齡（還沒過今年生日要減 1）
  - 可以用性別、年齡層篩選；兩張圖本身是篩選器：性別圖只套用年齡層的篩選，年齡層圖只套用性別的篩選
  - 還沒補填資料（沒有 member_profiles）的會員不知道性別、年齡，有篩選時一律不符合
"""

from datetime import date, timedelta

import pandas as pd

from db import query
from period import get_period

GENDER_LABEL = {"female": "女性", "male": "男性"}
# 年齡層：key、名稱、最小歲數、最大歲數（含）
AGE_GROUP_LIST = [
    ("u24", "24 歲以下", 0, 24),
    ("25-34", "25 – 34 歲", 25, 34),
    ("35-44", "35 – 44 歲", 35, 44),
    ("45up", "45 歲以上", 45, 999),
]
TOP_COUNT = 10
SIGNUP_MONTHS = 12

MEMBER_SQL = """
SELECT m.id, m.created_at, p.name, p.gender, p.birthday
FROM members m
    LEFT JOIN member_profiles p ON p.member_id = m.id
"""

# 全部有效訂單（會員下的）：判斷新客要看「第一筆」是什麼時候，所以不能只撈期間內的
VALID_ORDER_SQL = """
SELECT member_id, created_at, subtotal - discount AS amount
FROM orders
WHERE status NOT IN ('UNPAID', 'CANCELLED') AND member_id IS NOT NULL
"""


def age_of(birthday: date, today: date) -> int:
    """生日 → 今天幾歲（還沒過今年生日就要減 1）"""
    had_birthday = (today.month, today.day) >= (birthday.month, birthday.day)
    return today.year - birthday.year - (0 if had_birthday else 1)


def age_group_of(age: float) -> str | None:
    if pd.isna(age):
        return None
    return next(key for key, _, low, high in AGE_GROUP_LIST if low <= age <= high)


def load_members(today: date) -> pd.DataFrame:
    """全部會員，加上年齡、年齡層。index = 會員 id"""
    df = query(MEMBER_SQL).set_index("id")
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["age"] = df["birthday"].map(lambda birthday: age_of(birthday, today) if pd.notna(birthday) else None)
    df["age_group"] = df["age"].map(age_group_of)
    return df


def get_member_customers(range_key: str, today: date, gender: str | None, age_group: str | None) -> dict:
    start, end = get_period(range_key, today)
    if gender is not None and gender not in GENDER_LABEL:
        raise ValueError(f"不認識的性別：{gender}，只能是 {', '.join(GENDER_LABEL)}")
    age_name_of = {key: name for key, name, _, _ in AGE_GROUP_LIST}
    if age_group is not None and age_group not in age_name_of:
        raise ValueError(f"不認識的年齡層：{age_group}，只能是 {', '.join(age_name_of)}")

    member_df = load_members(today)
    order_df = query(VALID_ORDER_SQL)
    order_df["created_at"] = pd.to_datetime(order_df["created_at"])

    # 每個會員第一筆有效訂單的時間（全部訂單），和這段期間的訂單數、消費金額
    first_order_at = order_df.groupby("member_id")["created_at"].min()
    period_df = order_df[(order_df["created_at"] >= pd.Timestamp(start))
                         & (order_df["created_at"] < pd.Timestamp(end + timedelta(days=1)))]
    buyer_df = period_df.groupby("member_id").agg(order_count=("amount", "size"), amount=("amount", "sum"))
    buyer_df["is_new"] = first_order_at.reindex(buyer_df.index) >= pd.Timestamp(start)
    buyer_df = buyer_df.join(member_df)

    gender_mask = (buyer_df["gender"] == gender) if gender else pd.Series(True, index=buyer_df.index)
    age_mask = (buyer_df["age_group"] == age_group) if age_group else pd.Series(True, index=buyer_df.index)
    # 篩選後的資料：除了性別、年齡層兩張圖，其他區塊都用這份
    filtered_df = buyer_df[gender_mask & age_mask]

    filtered_member_df = member_df
    if gender:
        filtered_member_df = filtered_member_df[filtered_member_df["gender"] == gender]
    if age_group:
        filtered_member_df = filtered_member_df[filtered_member_df["age_group"] == age_group]
    signup_count = int(((filtered_member_df["created_at"] >= pd.Timestamp(start))
                        & (filtered_member_df["created_at"] < pd.Timestamp(end + timedelta(days=1)))).sum())

    new_count = int(filtered_df["is_new"].sum())
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "filter": {
            "gender": {"key": gender, "name": GENDER_LABEL[gender]} if gender else None,
            "ageGroup": {"key": age_group, "name": age_name_of[age_group]} if age_group else None,
        },
        "kpi": {
            "buyers": len(filtered_df),
            "newBuyers": new_count,
            "returningBuyers": len(filtered_df) - new_count,
            "signups": signup_count,
        },
        "buyerTypeList": buyer_types(filtered_df),
        # 性別圖只套用年齡層的篩選，年齡層圖只套用性別的篩選
        "genderList": group_summary(buyer_df[age_mask], "gender",
                                    [(key, name) for key, name in GENDER_LABEL.items()]),
        "ageGroupList": group_summary(buyer_df[gender_mask], "age_group",
                                      [(key, name) for key, name, _, _ in AGE_GROUP_LIST]),
        "topList": top_list(filtered_df),
        "signupList": signup_by_month(filtered_member_df, end),
    }


def buyer_types(df: pd.DataFrame) -> list[dict]:
    """新客、回購客各幾人、花多少、佔比、平均每人消費"""
    total_buyers = len(df)
    total_amount = int(df["amount"].sum())
    result = []
    for name, group_df in [("新客", df[df["is_new"]]), ("回購客", df[~df["is_new"]])]:
        buyers = len(group_df)
        amount = int(group_df["amount"].sum())
        result.append({
            "name": name,
            "buyers": buyers,
            "buyerPercent": round(buyers / total_buyers * 100, 1) if total_buyers else None,
            "amount": amount,
            "amountPercent": round(amount / total_amount * 100, 1) if total_amount else None,
            "avgAmount": round(amount / buyers) if buyers else None,
        })
    return result


def group_summary(df: pd.DataFrame, column: str, key_name_list: list[tuple[str, str]]) -> list[dict]:
    """依性別或年齡層加總：下單人數、消費金額、平均每人消費（照 key_name_list 的順序，沒有的也列出來）"""
    summary = df.groupby(column).agg(buyers=("amount", "size"), amount=("amount", "sum"))
    result = []
    for key, name in key_name_list:
        buyers = int(summary["buyers"].get(key, 0))
        amount = int(summary["amount"].get(key, 0))
        result.append({
            "key": key,
            "name": name,
            "buyers": buyers,
            "amount": amount,
            "avgAmount": round(amount / buyers) if buyers else None,
        })
    return result


def top_list(df: pd.DataFrame) -> list[dict]:
    """消費金額前 10 名的會員"""
    return [{
        "id": int(member_id),
        "name": row["name"] if pd.notna(row["name"]) else "（未填資料）",
        "gender": GENDER_LABEL.get(row["gender"]),
        "age": int(row["age"]) if pd.notna(row["age"]) else None,
        "isNew": bool(row["is_new"]),
        "amount": int(row["amount"]),
        "orderCount": int(row["order_count"]),
    } for member_id, row in df.nlargest(TOP_COUNT, "amount").iterrows()]


def signup_by_month(member_df: pd.DataFrame, end: date) -> list[dict]:
    """
    每月新註冊會員數：固定看最近 12 個月（到 end 那個月），不受期間影響，但會套用性別、年齡層的篩選
    最後一個月只算到 end，還沒過完，partial = True（畫面用淡色）
    """
    month_index = pd.period_range(end=pd.Period(end, "M"), periods=SIGNUP_MONTHS, freq="M")
    in_range = member_df["created_at"] < pd.Timestamp(end + timedelta(days=1))
    counts = member_df.loc[in_range, "created_at"].dt.to_period("M").value_counts()
    return [{
        "month": month.strftime("%Y/%m"),
        "count": int(counts.get(month, 0)),
        "partial": month == month_index[-1] and end != (month.end_time.date()),
    } for month in month_index]
