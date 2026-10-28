"""
銷售數據 > 商品銷售。畫面範本：sample/product-sales.html

計算規則：
  - 只算有效訂單：排除 UNPAID（未付款）和 CANCELLED（已取消）；訂單算在下單那天
  - 期間是「到昨天為止」往前 N 天，今天還沒過完不算
  - 銷售金額用 order_items.total_price（商品實際售價 × 件數，沒扣折價券）
  - 主分類 = 分類樹第 1 層（女裝 / 男裝 / 童裝），副分類 = 第 2 層（外套類、下身類…）
  - 可以用主分類、副分類篩選；兩張分類圖本身是篩選器，主分類圖永遠顯示全部
  - 熱銷、滯銷排行都依件數排、每頁 10 件：熱銷是有賣出的商品，最多的排前面；
    滯銷是上架中的商品，最少的排前面，件數一樣時庫存多的排前面。排行另外一支 API（get_product_rank），換頁不用重算整頁
"""

from datetime import date, timedelta
from typing import NamedTuple

import pandas as pd

from db import query
from period import get_period

# 主分類固定照這個順序排，不依金額重排
MAIN_CATEGORY_CODE_LIST = ["all_women", "all_men", "all_kids"]
KIDS_CATEGORY_CODE = "all_kids"

ADULT_SIZE_LIST = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"]
KIDS_SIZE_LIST = ["100cm", "110cm", "120cm", "130cm", "140cm", "150cm", "160cm"]

TOP_COUNT = 10        # 副分類、顏色只顯示前 10 名
RANK_PAGE_SIZE = 10   # 熱銷、滯銷排行一頁幾件
RANK_TYPE_LIST = ["hot", "slow"]

CATEGORY_SQL = "SELECT id, parent_id, name, code FROM categories"

PRODUCT_SQL = """
SELECT p.id, p.name, p.price, p.orig_price, p.status, p.image_url, p.category_id,
       COALESCE(v.stock, 0) AS stock
FROM products p
    LEFT JOIN (SELECT product_id, SUM(stock) AS stock FROM product_variants GROUP BY product_id) v ON v.product_id = p.id
"""

# 依「商品 + 顏色 + 尺寸」加總；顏色、尺寸用 order_items 下單當時存的值
SALES_SQL = """
SELECT v.product_id, oi.color, oi.size,
       SUM(oi.qty)         AS qty,
       SUM(oi.total_price) AS amount
FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN product_variants v ON v.id = oi.variant_id
WHERE o.status NOT IN ('UNPAID', 'CANCELLED')
  AND o.created_at >= ? AND o.created_at < ?
GROUP BY v.product_id, oi.color, oi.size
"""


def load_category_levels() -> pd.DataFrame:
    """每個分類往上找到第 1 層（主分類）和第 2 層（副分類）。index = 分類 id"""
    df = query(CATEGORY_SQL)
    parent_of = dict(zip(df["id"], df["parent_id"]))
    name_of = dict(zip(df["id"], df["name"]))
    code_of = dict(zip(df["id"], df["code"]))

    row_list = []
    for category_id in df["id"]:
        # 一路往上走到最上層，path 是 [最上層, 第 2 層, ..., 自己]
        path = [category_id]
        while pd.notna(parent_of[path[0]]):
            path.insert(0, int(parent_of[path[0]]))
        sub_id = path[1] if len(path) > 1 else None
        row_list.append({
            "category_id": category_id,
            "main_id": path[0],
            "main_name": name_of[path[0]],
            "main_code": code_of[path[0]],
            "sub_id": sub_id,
            "sub_name": name_of[sub_id] if sub_id else None,
        })
    return pd.DataFrame(row_list).set_index("category_id")


def load_products(category_df: pd.DataFrame) -> pd.DataFrame:
    """全部商品，加上主分類、副分類。index = 商品 id"""
    df = query(PRODUCT_SQL).set_index("id")
    return df.join(category_df, on="category_id")


class SalesData(NamedTuple):
    """商品銷售、商品排行共用的資料（篩選後）"""
    start: date
    end: date
    category_df: pd.DataFrame
    main_category_df: pd.DataFrame
    sales_df: pd.DataFrame            # 沒篩選的銷售，給兩張分類圖用
    filtered_sales_df: pd.DataFrame   # 篩選後的銷售（商品 + 顏色 + 尺寸一列）
    product_sales_df: pd.DataFrame    # 篩選後依商品加總，沒賣出的商品也在（件數 0）
    on_sale_df: pd.DataFrame          # product_sales_df 裡上架中的商品


def load_sales_data(range_key: str, today: date, main_id: int | None, sub_id: int | None) -> SalesData:
    start, end = get_period(range_key, today)
    if sub_id is not None and main_id is None:
        raise ValueError("選副分類時也要帶主分類")

    category_df = load_category_levels()
    product_df = load_products(category_df)
    main_category_df = category_df[category_df.index.isin(category_df["main_id"])]

    if main_id is not None and main_id not in main_category_df.index:
        raise ValueError(f"找不到主分類：{main_id}")
    if sub_id is not None and (sub_id not in category_df.index or category_df.loc[sub_id, "sub_id"] != sub_id
                               or category_df.loc[sub_id, "main_id"] != main_id):
        raise ValueError(f"副分類 {sub_id} 不在主分類 {main_id} 底下")

    # 每列 = 一個商品的一種顏色＋尺寸在這段期間賣了多少，接上商品資料
    sales_df = query(SALES_SQL, (start, end + timedelta(days=1)))
    sales_df = sales_df.join(product_df, on="product_id")

    # 篩選後的資料：除了兩張分類圖，其他區塊都用這份
    filtered_sales_df = filter_by_category(sales_df, main_id, sub_id)
    filtered_product_df = filter_by_category(product_df, main_id, sub_id)

    # 依商品加總，接回商品資料；沒賣出的商品不會在 sales 裡，所以用全部商品去接、補 0
    product_sales_df = filtered_product_df.join(
        filtered_sales_df.groupby("product_id")[["qty", "amount"]].sum(), how="left").fillna({"qty": 0, "amount": 0})
    on_sale_df = product_sales_df[product_sales_df["status"] == "ON_SALE"]
    return SalesData(start, end, category_df, main_category_df, sales_df, filtered_sales_df, product_sales_df, on_sale_df)


def get_product_sales(range_key: str, today: date, main_id: int | None, sub_id: int | None) -> dict:
    data = load_sales_data(range_key, today, main_id, sub_id)
    start, end, category_df, main_category_df = data.start, data.end, data.category_df, data.main_category_df
    sales_df, filtered_sales_df = data.sales_df, data.filtered_sales_df
    product_sales_df, on_sale_df = data.product_sales_df, data.on_sale_df

    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "filter": {
            "main": category_ref(main_id, category_df, "main_name"),
            "sub": category_ref(sub_id, category_df, "sub_name"),
        },
        "kpi": {
            "qty": int(filtered_sales_df["qty"].sum()),
            "soldProducts": int((product_sales_df["qty"] > 0).sum()),
            "onSaleProducts": len(on_sale_df),
            # 滯銷 = 上架中但一件都沒賣出
            "slowProducts": int((on_sale_df["qty"] == 0).sum()),
        },
        "mainCategoryList": main_category_summary(sales_df, main_category_df),
        "subCategoryList": sub_category_summary(sales_df, main_id),
        "color": color_summary(filtered_sales_df),
        "sizeGroupList": size_groups(filtered_sales_df, main_category_df, main_id, sub_id, category_df),
    }


def filter_by_category(df: pd.DataFrame, main_id: int | None, sub_id: int | None) -> pd.DataFrame:
    if main_id is not None:
        df = df[df["main_id"] == main_id]
    if sub_id is not None:
        df = df[df["sub_id"] == sub_id]
    return df


def category_ref(category_id: int | None, category_df: pd.DataFrame, name_column: str) -> dict | None:
    if category_id is None:
        return None
    return {"id": category_id, "name": category_df.loc[category_id, name_column]}


def main_category_summary(sales_df: pd.DataFrame, main_category_df: pd.DataFrame) -> list[dict]:
    """主分類銷售額和佔比，固定照 女裝 / 男裝 / 童裝 排（沒賣出也會列出來，金額 0）"""
    amount_by_main = sales_df.groupby("main_id")["amount"].sum()
    total = int(amount_by_main.sum())
    order = {code: i for i, code in enumerate(MAIN_CATEGORY_CODE_LIST)}
    sorted_df = main_category_df.assign(order=main_category_df["main_code"].map(order).fillna(99)).sort_values("order")
    return [{
        "id": int(category_id),
        "name": row["main_name"],
        "amount": int(amount_by_main.get(category_id, 0)),
        "percent": round(int(amount_by_main.get(category_id, 0)) / total * 100, 1) if total else 0,
    } for category_id, row in sorted_df.iterrows()]


def sub_category_summary(sales_df: pd.DataFrame, main_id: int | None) -> list[dict]:
    """副分類銷售額，金額大到小；沒選主分類時只取前 10 名，選了主分類就列出它底下有賣出的全部副分類"""
    df = sales_df if main_id is None else sales_df[sales_df["main_id"] == main_id]
    summary = (df.groupby(["main_id", "main_name", "sub_id", "sub_name"])["amount"].sum()
                 .sort_values(ascending=False).reset_index())
    if main_id is None:
        summary = summary.head(TOP_COUNT)
    return [{
        "mainId": int(row["main_id"]),
        "mainName": row["main_name"],
        "id": int(row["sub_id"]),
        "name": row["sub_name"],
        "amount": int(row["amount"]),
    } for _, row in summary.iterrows()]


def product_info(product_id: int, row: pd.Series) -> dict:
    """熱銷、滯銷排行共用的商品資料"""
    return {
        "id": int(product_id),
        "name": row["name"],
        "mainName": row["main_name"],
        "subName": row["sub_name"],
        "price": int(row["price"]),
        "onSale": pd.notna(row["orig_price"]),   # 有原價 = 特價中
        "imageUrl": row["image_url"],
    }


def get_product_rank(range_key: str, today: date, main_id: int | None, sub_id: int | None,
                     rank_type: str, page: int) -> dict:
    """
    商品排行的其中一頁（page 從 0 開始，跟 Spring 的分頁一樣），都依件數排：
      - hot：有賣出的商品，件數多的排前面，一樣時金額高的排前面
      - slow：上架中的商品，件數少的排前面，一樣時庫存多的排前面（壓著越多貨越要處理）
    """
    if rank_type not in RANK_TYPE_LIST:
        raise ValueError(f"不認識的排行：{rank_type}，只能是 {', '.join(RANK_TYPE_LIST)}")
    if page < 0:
        raise ValueError("頁數不能小於 0")
    data = load_sales_data(range_key, today, main_id, sub_id)
    if rank_type == "hot":
        sorted_df = data.product_sales_df[data.product_sales_df["qty"] > 0].sort_values(
            ["qty", "amount"], ascending=[False, False])
    else:
        sorted_df = data.on_sale_df.sort_values(["qty", "stock"], ascending=[True, False])

    total = len(sorted_df)
    page_df = sorted_df.iloc[page * RANK_PAGE_SIZE:(page + 1) * RANK_PAGE_SIZE]
    return {
        # 名次從 1 開始，第 2 頁第一個是第 11 名
        "content": [{"rank": page * RANK_PAGE_SIZE + index + 1} | product_info(product_id, row)
                    | {"qty": int(row["qty"]), "amount": int(row["amount"]), "stock": int(row["stock"])}
                    for index, (product_id, row) in enumerate(page_df.iterrows())],
        "page": {
            "number": page,
            "size": RANK_PAGE_SIZE,
            "totalElements": total,
            "totalPages": (total + RANK_PAGE_SIZE - 1) // RANK_PAGE_SIZE,
        },
    }


def color_summary(sales_df: pd.DataFrame) -> dict:
    """依顏色的件數前 10 名；其餘的只給種類數和合計件數（畫成長條會比前幾名還大，看不出重點）"""
    qty_by_color = sales_df.groupby("color")["qty"].sum()
    qty_by_color = qty_by_color[qty_by_color > 0].sort_values(ascending=False)
    other = qty_by_color.iloc[TOP_COUNT:]
    return {
        "topList": [{"name": name, "qty": int(qty)} for name, qty in qty_by_color.head(TOP_COUNT).items()],
        "otherCount": len(other),
        "otherQty": int(other.sum()),
    }


def size_sort_key(size: str) -> tuple:
    """尺寸排成合理的順序：XS～4XL → 100～160cm → 腰圍 inch、其他 cm（數字小到大）→ 其他"""
    if size in ADULT_SIZE_LIST:
        return 0, ADULT_SIZE_LIST.index(size), size
    if size in KIDS_SIZE_LIST:
        return 1, KIDS_SIZE_LIST.index(size), size
    number = "".join(ch for ch in size.split("-")[0] if ch.isdigit())
    if size.endswith("inch") and number:
        return 2, int(number), size
    if size.endswith("cm") and number:
        return 3, int(number), size
    return 4, 0, size


def size_group(key: str, name: str, note: str, size_list: list[str], qty_by_size: pd.Series) -> dict:
    return {
        "key": key,
        "name": name,
        "note": note,
        "list": [{"size": size, "qty": int(qty_by_size.get(size, 0))} for size in size_list],
    }


def size_groups(sales_df: pd.DataFrame, main_category_df: pd.DataFrame, main_id: int | None, sub_id: int | None,
                category_df: pd.DataFrame) -> list[dict]:
    """
    尺寸圖要顯示的組別（照大小順序排，不依件數重排）：
      - 選了副分類：只有一組，顯示這個分類實際有賣出的尺寸（例如下身類幾乎都是腰圍 inch）
      - 選了主分類：童裝只有 cm、女裝男裝只有 XS～4XL，只給對應的一組
      - 沒篩選：成人、童裝兩組，前端用按鈕切換
    """
    qty_by_size = sales_df.groupby("size")["qty"].sum()
    adult = size_group("adult", "成人", "成人尺寸 XS～4XL；褲子腰圍（inch）、單一尺寸不列入", ADULT_SIZE_LIST, qty_by_size)
    kids = size_group("kids", "童裝", "童裝尺寸 100～160cm；其他尺寸不列入", KIDS_SIZE_LIST, qty_by_size)
    if sub_id is not None:
        sold_size_list = sorted(qty_by_size[qty_by_size > 0].index, key=size_sort_key)
        sub_name = category_df.loc[sub_id, "sub_name"]
        return [size_group("sub", sub_name, f"{sub_name}有賣出的尺寸", sold_size_list, qty_by_size)]
    if main_id is not None:
        return [kids] if main_category_df.loc[main_id, "main_code"] == KIDS_CATEGORY_CODE else [adult]
    return [adult, kids]
