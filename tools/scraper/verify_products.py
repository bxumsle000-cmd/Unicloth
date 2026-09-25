"""
檢查 products.json 與圖片檔是否一致、有沒有會讓資料庫塞不進去的資料。

爬完之後、匯入資料庫之前跑一次：
  python tools/scraper/verify_products.py
  python tools/scraper/verify_products.py src/main/resources/data/products-leaf.json   # 檢查其他 JSON

檢查項目（對應 V1__init.sql 的限制）：
  1. 每個 variants[].url 指到的圖片檔真的存在
  2. slug 不重複            → products.uk_products_slug
  3. skuCode 不重複         → product_variants.uk_variants_sku
  4. 同商品 (color, size) 不重複 → product_variants.uk_variants_product_color_size
  5. 必填欄位不是空的、價格是正整數
"""

import json
import sys
from collections import Counter
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = PROJECT_ROOT / "src/main/resources/data/products.json"
STATIC_DIR = PROJECT_ROOT / "src/main/resources/static"


def category_label(p: dict) -> str:
    """舊格式 mainCategory / subCategory，新格式（uniqlo_leaf_scraper）categoryPath 三層"""
    if "categoryPath" in p:
        return " / ".join(p["categoryPath"])
    return f"{p.get('mainCategory')} / {p.get('subCategory')}"


def main() -> int:
    json_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else JSON_PATH
    if not json_path.exists():
        print(f"找不到 {json_path}")
        return 1
    products = json.loads(json_path.read_text(encoding="utf-8"))
    problems: list[str] = []

    slug_counts = Counter(p["slug"] for p in products)
    for slug, n in slug_counts.items():
        if n > 1:
            problems.append(f"slug 重複 {n} 次：{slug}")

    sku_counts = Counter(v["skuCode"] for p in products for v in p["variants"])
    for sku, n in sku_counts.items():
        if n > 1:
            problems.append(f"skuCode 重複 {n} 次：{sku}")

    for p in products:
        slug = p["slug"]
        category_fields = ("categoryPath", "categoryCode") if "categoryPath" in p else ("mainCategory", "subCategory")
        for field in ("slug", "name") + category_fields:
            if not p.get(field):
                problems.append(f"{slug}：欄位 {field} 是空的")
        if "categoryPath" in p:
            for field in ("categoryPath", "categoryCode"):
                value = p.get(field) or []
                if len(value) != 3 or not all(value):
                    problems.append(f"{slug}：{field} 應該是三個非空值（{value}）")
        if not isinstance(p.get("price"), int) or p["price"] <= 0:
            problems.append(f"{slug}：price 不是正整數（{p.get('price')}）")
        if p.get("origPrice") is not None and p["origPrice"] <= p["price"]:
            problems.append(f"{slug}：origPrice {p['origPrice']} 沒有大於 price {p['price']}，應該設成 null")
        if not p.get("variants"):
            problems.append(f"{slug}：沒有任何 variant")

        seen: set[tuple[str, str]] = set()
        for v in p["variants"]:
            key = (v["color"], v["size"])
            if key in seen:
                problems.append(f"{slug}：(color, size) 重複 {key}")
            seen.add(key)
            if not (STATIC_DIR / v["url"]).exists():
                problems.append(f"{slug}：圖片不存在 {v['url']}")
            if not isinstance(v.get("stock"), int) or v["stock"] < 0:
                problems.append(f"{slug}：stock 不是非負整數（{v.get('stock')}）")

    total_sku = sum(len(p["variants"]) for p in products)
    image_files = {str(f.relative_to(STATIC_DIR)).replace("\\", "/")
                   for f in (STATIC_DIR / "img/products").rglob("*.jpg")} if (STATIC_DIR / "img/products").exists() else set()
    used_urls = {v["url"] for p in products for v in p["variants"]}
    orphan = sorted(image_files - used_urls)

    print(f"商品 {len(products)} 件、SKU {total_sku} 筆、圖片檔 {len(image_files)} 張")
    cats = Counter(category_label(p) for p in products)
    for c, n in sorted(cats.items()):
        print(f"  {c}：{n} 件")
    if orphan:
        print(f"提醒：有 {len(orphan)} 張圖片沒被任何 SKU 用到（不影響匯入，可能是舊資料）")
        for o in orphan[:5]:
            print(f"  - {o}")

    if problems:
        print(f"\n✗ 發現 {len(problems)} 個問題：")
        for msg in problems[:50]:
            print(f"  - {msg}")
        if len(problems) > 50:
            print(f"  ...還有 {len(problems) - 50} 個")
        return 1

    print("\n✓ 全部通過，可以匯入資料庫")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
