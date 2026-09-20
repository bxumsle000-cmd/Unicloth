"""
Uniqlo 台灣官網商品爬蟲（學校專題用，小量資料）

輸出：
  1. 圖片  → src/main/resources/static/img/products/{slug}/{colorKey}.jpg
  2. JSON  → src/main/resources/data/products.json（欄位對應資料庫 products / product_variants）

用法（在專案根目錄執行）：
  python tools/scraper/uniqlo_scraper.py --check all_kids-outer   # 加新分類前先確認代碼存在
  python tools/scraper/uniqlo_scraper.py --limit 2                # 先小量測試
  python tools/scraper/uniqlo_scraper.py --limit 10               # 每個分類 10 個商品
  python tools/scraper/verify_products.py                         # 爬完檢查資料能不能進 DB

完整流程見 .claude/skills/uniqlo-scrape/SKILL.md

資料來源（用瀏覽器 DevTools 觀察官網得到的 API）：
  列表：POST https://d.uniqlo.com/tw/p/search/products/by-category
  明細：GET  https://d.uniqlo.com/tw/p/product/detail?productCode=...
  圖片：https://www.uniqlo.com/tw/hmall/test/{productCode}/sku/561/{COLxx}.jpg
"""

import argparse
import json
import random
import re
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ------------------------------------------------------------------ 設定

# 專案根目錄：這個檔案在 tools/scraper/ 底下，往上兩層
PROJECT_ROOT = Path(__file__).resolve().parents[2]
IMG_DIR = PROJECT_ROOT / "src/main/resources/static/img/products"
JSON_PATH = PROJECT_ROOT / "src/main/resources/data/products.json"

API_LIST = "https://d.uniqlo.com/tw/p/search/products/by-category"
API_DETAIL = "https://d.uniqlo.com/tw/p/product/detail"
IMG_HOST = "https://www.uniqlo.com/tw"

# 要爬的分類：(Uniqlo 分類代碼, 主分類, 副分類, slug 前綴)
CATEGORIES = [
    ("all_women-outer", "女裝", "外套類", "women"),
    ("all_women-tops", "女裝", "T恤/背心/休閒上衣", "women"),
    ("all_men-outer", "男裝", "外套類", "men"),
    ("all_men-tops", "男裝", "T恤/背心/休閒上衣", "men"),
]

# Uniqlo 台灣站的顏色只有英文，這裡做常見顏色的對照；對不到就保留英文
COLOR_ZH = {
    "WHITE": "白色", "OFF WHITE": "米白色", "BLACK": "黑色", "GRAY": "灰色",
    "DARK GRAY": "深灰色", "LIGHT GRAY": "淺灰色", "CHARCOAL": "炭灰色",
    "NAVY": "藏青色", "BLUE": "藍色", "LIGHT BLUE": "淺藍色", "DARK BLUE": "深藍色",
    "RED": "紅色", "WINE": "酒紅色", "PINK": "粉紅色", "PURPLE": "紫色", "LIGHT PURPLE": "淺紫色",
    "GREEN": "綠色", "DARK GREEN": "深綠色", "OLIVE": "橄欖綠", "KHAKI": "卡其色",
    "YELLOW": "黃色", "MUSTARD": "芥末黃", "ORANGE": "橘色", "DARK ORANGE": "深橘色", "LIGHT GREEN": "淺綠色", "DARK PURPLE": "深紫色",
    "BROWN": "咖啡色", "DARK BROWN": "深咖啡色", "BEIGE": "米色", "NATURAL": "原色",
    "CREAM": "奶油色", "IVORY": "象牙白", "SILVER": "銀色", "GOLD": "金色",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
    "Origin": "https://www.uniqlo.com",
    "Referer": "https://www.uniqlo.com/tw/zh_TW/",
}

session = requests.Session()
session.headers.update(HEADERS)


def polite_sleep():
    """每個 request 之間停 1～2 秒，不要對網站造成負擔"""
    time.sleep(random.uniform(1.0, 2.0))


# ------------------------------------------------------------------ API 呼叫

def fetch_product_list(category_code: str, limit: int) -> list[dict]:
    body = {
        "pageInfo": {"page": 1, "pageSize": limit},
        "belongTo": "pc",
        "rank": "overall",
        "priceRange": {"low": 0, "high": 0},
        "color": [], "size": [], "identity": [], "exist": [],
        "categoryCode": category_code,
        "searchFlag": False,
        "description": "",
        "stockFilter": "warehouse",
    }
    r = session.post(API_LIST, json=body, timeout=20)
    r.raise_for_status()
    data = r.json()
    if not data.get("success"):
        raise RuntimeError(f"列表 API 回傳失敗: {data.get('msg')}")
    resp = data["resp"][0]
    print(f"  分類「{resp.get('categoryTitleName')}」共 {resp.get('productSum')} 件，取前 {limit} 件")
    return resp["productList"]


def fetch_product_detail(product_code: str) -> dict:
    params = {"productCode": product_code, "distribution": "EXPRESS", "type": "DETAIL"}
    r = session.get(API_DETAIL, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    if not data.get("success"):
        raise RuntimeError(f"明細 API 回傳失敗: {data.get('msg')}")
    return data["resp"][0]


def fetch_description(product_code: str) -> str | None:
    """商品說明是一頁 HTML，抓下來去掉標籤只留文字"""
    url = f"{IMG_HOST}/hmall/test/{product_code}/zh_TW/instruction.html"
    try:
        r = session.get(url, timeout=20)
        if r.status_code != 200:
            return None
        text = BeautifulSoup(r.text, "html.parser").get_text(" ", strip=True)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:500] or None
    except requests.RequestException:
        return None


def download_image(product_code: str, color_no: str, dest: Path, fallback: str | None) -> bool:
    """下載某個顏色的主圖；檔案已存在就跳過。抓不到時退而用商品主圖。"""
    if dest.exists():
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    candidates = [f"{IMG_HOST}/hmall/test/{product_code}/sku/561/{color_no}.jpg"]
    if fallback:
        candidates.append(IMG_HOST + fallback)
    for url in candidates:
        try:
            r = session.get(url, timeout=30)
            if r.status_code == 200 and r.headers.get("Content-Type", "").startswith("image"):
                dest.write_bytes(r.content)
                polite_sleep()
                return True
        except requests.RequestException:
            pass
    return False


# ------------------------------------------------------------------ 轉換成我們的格式

def parse_color(style_text: str) -> str:
    """'478571 / 30 NATURAL' 或 '57 OLIVE' → 'NATURAL' / 'OLIVE'"""
    s = (style_text or "").split("/")[-1].strip()   # 有斜線就取最後一段
    s = re.sub(r"^\d+\s+", "", s)                    # 去掉開頭的顏色代碼
    return s.strip().upper()


def build_product(list_item: dict, detail: dict, main_cat: str, sub_cat: str, prefix: str, stats: dict) -> dict | None:
    summary = detail["spuInfo"]["summary"]
    rows = detail["spuInfo"]["rows"]
    sku_stocks = detail.get("stockInfo", {}).get("skuStocks") or {}

    product_code = summary["productCode"]          # u0000000055012（API 用）
    product_no = summary["code"]                   # 487406（人看的商品編號）
    slug = f"{prefix}-{product_no}"

    # 名稱後面會帶一或多組編號（"...連帽外套 479800 /" 或 "...T恤 485562 / 479781 /"），全部拿掉
    name = re.sub(r"(\s*\d{6}\s*/?\s*)+$", "", summary.get("name") or list_item.get("name") or "").strip()

    # 先決定每個色號的顯示名稱。同一件商品可能有兩個色號都叫 PINK（COL10、COL12），
    # 翻成中文會撞名，而資料庫有 UNIQUE(product_id, color, size)，所以撞名時把色號加在後面。
    color_names: dict[str, str] = {}
    for row in rows:
        color_no = row["colorNo"]
        if color_no in color_names:
            continue
        color_en = parse_color(row.get("styleText"))
        name_zh = COLOR_ZH.get(color_en, color_en.title())
        if name_zh in color_names.values():
            name_zh = f"{name_zh}({color_no[3:]})"   # COL12 → 粉紅色(12)
        color_names[color_no] = name_zh

    variants = []
    seen = set()
    for row in rows:
        if row.get("enabledFlag") != "Y":
            continue
        color_no = row["colorNo"]                  # COL30
        color_key = color_no.lower()               # col30（檔名用）
        size = str(row.get("sizeText") or row.get("size")).strip()
        if (color_no, size) in seen:               # 資料庫有 UNIQUE(product_id, color, size)
            continue
        seen.add((color_no, size))

        dest = IMG_DIR / slug / f"{color_key}.jpg"
        if not download_image(product_code, color_no, dest, list_item.get("mainPic")):
            print(f"    [警告] 圖片抓不到：{slug} {color_no}，跳過這個顏色")
            continue
        stats["images"].add(str(dest))

        variants.append({
            "color": color_names[color_no],
            "colorKey": color_key,
            "size": size,
            "skuCode": f"{product_no}-{color_no}-{size}".upper(),
            "stock": int(sku_stocks.get(row["productId"], 0)),
            "url": f"img/products/{slug}/{color_key}.jpg",
        })

    if not variants:
        return None

    price = min(v for v in (r.get("varyPrice") or r.get("price") for r in rows) if v)
    orig_price = summary.get("originPrice")
    if not orig_price or orig_price <= price:
        orig_price = None

    return {
        "slug": slug,
        "name": name,
        "mainCategory": main_cat,
        "subCategory": sub_cat,
        "description": fetch_description(product_code),
        "price": int(price),
        "origPrice": int(orig_price) if orig_price else None,
        "isNew": summary.get("isNew") == "Y",
        "isHot": False,
        "variants": variants,
    }


# ------------------------------------------------------------------ 主流程

def check_category(code: str) -> None:
    """只查分類存不存在、叫什麼、有幾件，不下載任何東西。加新分類前先用這個確認代碼。"""
    body = {
        "pageInfo": {"page": 1, "pageSize": 1}, "belongTo": "pc", "rank": "overall",
        "priceRange": {"low": 0, "high": 0}, "color": [], "size": [], "identity": [], "exist": [],
        "categoryCode": code, "searchFlag": False, "description": "", "stockFilter": "warehouse",
    }
    r = session.post(API_LIST, json=body, timeout=20)
    data = r.json()
    resp = (data.get("resp") or [{}])[0]
    if not data.get("success") or not resp.get("productList"):
        print(f"✗ {code}：找不到這個分類，或分類下沒有商品（msg={data.get('msg')}）")
        return
    print(f"✓ {code}：「{resp.get('categoryTitleName')}」共 {resp.get('productSum')} 件")
    print(f"  第一件：{resp['productList'][0].get('name')}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10, help="每個分類最多抓幾個商品")
    ap.add_argument("--check", metavar="CATEGORY_CODE", help="只確認分類代碼是否存在，不下載")
    args = ap.parse_args()

    if args.check:
        check_category(args.check)
        return

    products = []
    seen_slugs = set()
    stats = {"images": set(), "skipped": 0, "failed": 0}

    for cat_code, main_cat, sub_cat, prefix in CATEGORIES:
        print(f"\n=== {main_cat} / {sub_cat} ({cat_code}) ===")
        try:
            items = fetch_product_list(cat_code, args.limit)
        except Exception as e:
            print(f"  [失敗] 列表抓不到：{e}")
            stats["failed"] += 1
            continue
        polite_sleep()

        for item in items:
            slug = f"{prefix}-{item['code']}"
            if slug in seen_slugs:                  # 同一件商品可能同時出現在兩個分類
                stats["skipped"] += 1
                continue
            try:
                detail = fetch_product_detail(item["productCode"])
                polite_sleep()
                p = build_product(item, detail, main_cat, sub_cat, prefix, stats)
                if p is None:
                    print(f"  [略過] {slug} 沒有可用的 SKU")
                    stats["skipped"] += 1
                    continue
                products.append(p)
                seen_slugs.add(slug)
                print(f"  ✓ {slug}  {p['name']}  NT${p['price']}  SKU×{len(p['variants'])}")
            except Exception as e:
                print(f"  [失敗] {slug}: {e}")
                stats["failed"] += 1

    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")

    total_sku = sum(len(p["variants"]) for p in products)
    print("\n=== 完成 ===")
    print(f"商品：{len(products)} 件")
    print(f"SKU ：{total_sku} 筆")
    print(f"圖片：{len(stats['images'])} 張")
    print(f"略過：{stats['skipped']}，失敗：{stats['failed']}")
    print(f"JSON：{JSON_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
