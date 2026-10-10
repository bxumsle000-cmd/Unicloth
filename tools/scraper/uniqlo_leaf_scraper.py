"""
Uniqlo 台灣官網商品爬蟲：照官網「分類」篩選器一路展開到最底層，保留官網完整分類（3 或 4 層）

  官網 4 層  男裝 › T恤/背心/休閒 › T恤/背心 › 長袖
  官網 3 層  男裝 › 下身類 › 卡其褲（第 3 層就沒有下一層了）

輸出：
  1. 圖片  → src/main/resources/static/img/products/{slug}/{colorKey}.jpg
  2. JSON  → src/main/resources/data/products.json（DataSeeder 讀的檔案）

用法（在專案根目錄執行）：
  python tools/scraper/uniqlo_leaf_scraper.py --tree               # 只印分類樹與每個細類的商品數，不抓商品
  python tools/scraper/uniqlo_leaf_scraper.py --per-gender 2       # 先小量測試
  python tools/scraper/uniqlo_leaf_scraper.py                      # 男裝、女裝、童裝全部商品
  python tools/scraper/verify_products.py

分類樹怎麼來的：
  列表 API（by-category）回傳的 conditionList 裡，code = "categoryDesc" 那一項就是官網「分類」篩選器，
  裡面分 topCategory / levelOneCategory / levelTwoCategory / levelThreeCategory 四層，
  找到目前分類在哪一層，它的下一層就是子分類。這樣可以從大類一路往下展開，不用手動寫代碼。

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

# 專案根目錄：這個檔案在 tools/scraper/ 底下，往上兩層
PROJECT_ROOT = Path(__file__).resolve().parents[2]
IMG_DIR = PROJECT_ROOT / "src/main/resources/static/img/products"
JSON_PATH = PROJECT_ROOT / "src/main/resources/data/products.json"
API_LIST = "https://d.uniqlo.com/tw/p/search/products/by-category"
API_DETAIL = "https://d.uniqlo.com/tw/p/product/detail"
IMG_HOST = "https://www.uniqlo.com/tw"
LEVEL_KEYS = ["topCategory", "levelOneCategory", "levelTwoCategory", "levelThreeCategory"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
    "Origin": "https://www.uniqlo.com",
    "Referer": "https://www.uniqlo.com/tw/zh_TW/",
}

session = requests.Session()
session.headers.update(HEADERS)

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

# 要爬的性別：(官網代碼, 中文, slug 前綴, 要收的大類代碼後綴)
# 大類只收官網選單上「服裝種類」那一區；AIRism、HEATTECH、聯名、UT、亞麻、運動機能等「系列」不收。
GENDERS = [
    ("all_men", "男裝", "men",
     ["outer", "tops", "shirts", "knit", "bottoms", "inner-wear", "room", "accessories"]),
    ("all_women", "女裝", "women",
     ["outer", "tops", "shirts", "knit", "bottoms", "dresses-and-skirts", "inner-wear", "room", "accessories"]),
    ("all_kids", "童裝", "kids",
     ["outer", "tops", "knit", "bottoms", "dresses-and-skirts", "inner-wear", "room", "accesories"]),  # 官網就拼成 accesories
]

# 服裝種類底下仍然是「系列」的分類，整支不收（代碼結尾比對）
SKIP_NODE_SUFFIXES = (
    "-tops-peace-for-all",        # PEACE FOR ALL 慈善T恤
    "-outer-pufftech",            # PUFFTECH 輕暖科技
    "-inner-wear-airism",         # 內衣類 › AIRism 系列
    "-inner-wear-heattech",       # 內衣類 › HEATTECH 吸濕發熱衣
    "-accessories-lineup",        # 男裝配件(男女適用)：把其他配件全部再列一次的總表
)

# 不是「服裝種類」的細類：性別、材質、版型、系列。
# 規則：大類底下有其他細類時，這些不收；如果大類底下只剩這些（例如男裝 POLO衫 全是材質），就保留，
# 不然那個大類會沒有任何細類。被排除的細類仍會出現在商品的 alsoIn 裡。
ATTRIBUTE_NAMES = {
    # 性別
    "女裝/男女適穿", "男裝/男女適穿", "男女童皆適穿",
    # 材質、機能
    "AIRism棉質", "AIRism 棉質", "AIRism 系列", "AIRism 涼感", "AIRism超無痕", "棉質", "棉質(Cotton)",
    "棉質混紡(Jersey)", "棉質彈性", "刷毛", "DRY-EX 快乾", "DRY-EX", "DRY 多色", "DRY 網眼", "DRY 抗皺",
    "Easy Care", "特級抗皺", "牛津", "丹寧/工裝", "亞麻", "嫘縈", "法蘭絨/格紋", "燈芯絨", "亞麻/刷毛/其他",
    "美麗諾", "喀什米爾", "喀什米爾混紡", "米蘭羅紋", "柔軟舒膚", "小羊毛", "可機洗", "3D針織",
    "防曬 (UV Protection)", "防曬/針織", "特級彈性", "特級彈性/保暖/機能", "機能/特級彈性",
    # 版型
    "短版/顯瘦修身", "標準版型", "舒適寬鬆",
    # 系列、通路
    "UT印花T恤", "HEATTECH 襪子", "SUPIMA 系列", "50色素面單色襪", "網路獨家", "收納袋", "輕薄型",
}
# 名稱一樣但只有在特定大類底下才算屬性的（童裝 › 短褲/褲裙 底下的「女童」是性別，童裝內褲的「女童」則是種類）
ATTRIBUTE_CODES = {"all_kids-bottoms-short-anchor02"}


# ------------------------------------------------------------------ API

def polite_sleep():
    """每個 request 之間停 1～2 秒，不要對網站造成負擔"""
    time.sleep(random.uniform(1.0, 2.0))


def fetch_list(category_code: str, page_size: int, page: int = 1) -> dict:
    body = {
        "pageInfo": {"page": page, "pageSize": page_size},
        "belongTo": "pc", "rank": "overall",
        "priceRange": {"low": 0, "high": 0},
        "color": [], "size": [], "identity": [], "exist": [],
        "categoryCode": category_code,
        "searchFlag": False, "description": "", "stockFilter": "warehouse",
    }
    r = session.post(API_LIST, json=body, timeout=20)
    r.raise_for_status()
    polite_sleep()
    return r.json()["resp"][0]


def fetch_all_items(category_code: str, page_size: int = 200) -> list[dict]:
    """一頁一頁往下翻，把這個分類的商品全部抓完（某頁不滿 page_size 就是最後一頁）"""
    items, seen, page = [], set(), 1
    while True:
        batch = fetch_list(category_code, page_size, page)["productList"]
        new = [x for x in batch if x["code"] not in seen]
        if not new:                                 # 保險：API 如果不認 page、一直回同一頁，就停下來
            return items
        items.extend(new)
        seen.update(x["code"] for x in new)
        if len(batch) < page_size:
            return items
        page += 1


def fetch_children(code: str) -> list[dict]:
    """官網分類篩選器裡，這個分類的下一層"""
    resp = fetch_list(code, 1)
    cond = next(c for c in resp["conditionList"] if c.get("code") == "categoryDesc")
    level = next(i for i, k in enumerate(LEVEL_KEYS) if any(x["code"] == code for x in cond[k]))
    if level + 1 >= len(LEVEL_KEYS):
        return []
    return [{"code": x["code"], "name": x["name"]} for x in cond[LEVEL_KEYS[level + 1]] if x["code"] != code]


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


# ------------------------------------------------------------------ 分類樹

def build_groups(gender_code: str, gender_name: str, subs: list[str]) -> list[dict]:
    """
    展開一個性別的分類樹，回傳「細類群組」：每組 = 細類的上層路徑 + 同一個上層底下的細類。
    ancestors = 性別之後、細類之前的官網分類（1 或 2 層），細類 = 官網最後一層。
    """
    top_children = {c["code"]: c["name"] for c in fetch_children(gender_code)}
    groups = []

    def add_group(ancestors: list[dict], leaves: list[dict]):
        kept = [l for l in leaves if l["name"] not in ATTRIBUTE_NAMES and l["code"] not in ATTRIBUTE_CODES]
        groups.append({"ancestors": ancestors, "leaves": leaves, "kept": kept or leaves})

    for sub in subs:
        l2 = {"code": f"{gender_code}-{sub}", "name": top_children[f"{gender_code}-{sub}"]}
        childless = []                                      # 沒有下一層的，大類就是 l2
        for l3 in fetch_children(l2["code"]):
            if l3["code"].endswith(SKIP_NODE_SUFFIXES):
                continue
            l4s = fetch_children(l3["code"])
            if l4s:
                add_group([l2, l3], l4s)                    # 男裝 › T恤/背心/休閒 › T恤/背心 › 長袖
            else:
                childless.append(l3)
        if childless:
            add_group([l2], childless)                      # 男裝 › 下身類 › 卡其褲

    # 每個細類的完整商品清單：用來挑商品，也用來算 alsoIn
    for g in groups:
        for leaf in g["leaves"]:
            leaf["items"] = fetch_all_items(leaf["code"])
    return groups


def print_groups(gender_name: str, groups: list[dict]):
    print(f"\n===== {gender_name}")
    for g in groups:
        print(f"  {' › '.join(a['name'] for a in g['ancestors'])}  ({g['ancestors'][-1]['code']})")
        for leaf in g["leaves"]:
            mark = "收" if leaf in g["kept"] else "  "
            print(f"    [{mark}] {leaf['name']}  {len(leaf['items'])} 件")


# ------------------------------------------------------------------ 轉換成我們的格式

def parse_color(style_text: str) -> str:
    """'478571 / 30 NATURAL' 或 '57 OLIVE' → 'NATURAL' / 'OLIVE'"""
    s = (style_text or "").split("/")[-1].strip()   # 有斜線就取最後一段
    s = re.sub(r"^\d+\s+", "", s)                    # 去掉開頭的顏色代碼
    return s.strip().upper()


def build_product(item: dict, detail: dict, category_path: list[str], category_code: list[str],
                  also_in: list[str], prefix: str, stats: dict) -> dict | None:
    """一件商品轉成 products.json 的格式，欄位對應資料庫 products / product_variants"""
    summary = detail["spuInfo"]["summary"]
    rows = detail["spuInfo"]["rows"]
    sku_stocks = detail.get("stockInfo", {}).get("skuStocks") or {}

    product_code = summary["productCode"]
    product_no = summary["code"]
    slug = f"{prefix}-{product_no}"
    name = re.sub(r"(\s*\d{6}\s*/?\s*)+$", "", summary.get("name") or item.get("name") or "").strip()

    # 同一件商品可能有兩個色號翻成同一個中文（COL10、COL12 都是 PINK），撞名就在後面加色號
    color_names: dict[str, str] = {}
    for row in rows:
        color_no = row["colorNo"]
        if color_no in color_names:
            continue
        color_en = parse_color(row.get("styleText"))
        name_zh = COLOR_ZH.get(color_en, color_en.title())
        if name_zh in color_names.values():
            name_zh = f"{name_zh}({color_no[3:]})"
        color_names[color_no] = name_zh

    variants = []
    seen = set()
    for row in rows:
        if row.get("enabledFlag") != "Y":
            continue
        color_no = row["colorNo"]
        color_key = color_no.lower()
        size = str(row.get("sizeText") or row.get("size")).strip()
        if (color_no, size) in seen:
            continue
        seen.add((color_no, size))

        dest = IMG_DIR / slug / f"{color_key}.jpg"
        if not download_image(product_code, color_no, dest, item.get("mainPic")):
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
        "categoryPath": category_path,   # ["男裝", "T恤/背心/休閒", "T恤/背心", "長袖"]：官網完整分類，3 或 4 層
        "categoryCode": category_code,   # ["all_men", "all_men-tops", "all_men-tops-t-shirts", "all_men-tops-t-shirts-anchor01"]
        "alsoIn": also_in,               # 同一個大類底下，這件商品也出現在哪些細類（含沒收的材質、版型）
        "description": fetch_description(product_code),
        "price": int(price),
        "origPrice": int(orig_price) if orig_price else None,
        "isNew": summary.get("isNew") == "Y",
        "isHot": False,
        "variants": variants,
    }


# ------------------------------------------------------------------ 主流程

def crawl_gender(gender_code: str, gender_name: str, prefix: str, groups: list[dict],
                 limit: int | None, seen_codes: set, stats: dict) -> list[dict]:
    """依序把每個細類的商品全部收完；有給 limit 就收到 limit 件為止（小量測試用）"""
    products = []
    for g in groups:
        for leaf in g["kept"]:
            for item in leaf["items"]:
                if limit is not None and len(products) >= limit:
                    return products
                if item["code"] in seen_codes:      # 已經被別的細類（或別的性別）收走：同一件商品只收一次
                    stats["skipped_dup"] += 1
                    continue
                seen_codes.add(item["code"])
                slug = f"{prefix}-{item['code']}"
                also_in = [l["name"] for l in g["leaves"]
                           if l is not leaf and any(x["code"] == item["code"] for x in l["items"])]
                path = [gender_name] + [a["name"] for a in g["ancestors"]] + [leaf["name"]]
                codes = [gender_code] + [a["code"] for a in g["ancestors"]] + [leaf["code"]]
                try:
                    detail = fetch_product_detail(item["productCode"])
                    polite_sleep()
                    p = build_product(item, detail, path, codes, also_in, prefix, stats)
                except Exception as e:
                    print(f"  [失敗] {slug}: {e}")
                    stats["failed"] += 1
                    continue
                if p is None:
                    print(f"  [略過] {slug} 沒有可用的 SKU")
                    continue
                products.append(p)
                print(f"  ✓ {len(products):>4} {' › '.join(path)}  {slug}  {p['name']}  SKU×{len(p['variants'])}")
    return products


def save_json(products: list[dict]):
    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-gender", type=int, default=None, help="每個性別最多抓幾件（測試用，不給就全部抓）")
    ap.add_argument("--tree", action="store_true", help="只印分類樹與商品數，不抓商品")
    args = ap.parse_args()

    all_products = []
    seen_codes: set[str] = set()                    # 用商品編號去重：男女適穿的商品會同時出現在男裝和女裝
    stats = {"images": set(), "skipped_dup": 0, "failed": 0}
    counts = {}

    for gender_code, gender_name, prefix, subs in GENDERS:
        print(f"\n展開 {gender_name} 分類樹…")
        groups = build_groups(gender_code, gender_name, subs)
        print_groups(gender_name, groups)
        if args.tree:
            continue
        print(f"\n=== 抓 {gender_name} {args.per_gender or '全部'} 件 ===")
        ps = crawl_gender(gender_code, gender_name, prefix, groups, args.per_gender, seen_codes, stats)
        counts[gender_name] = len(ps)
        all_products.extend(ps)
        save_json(all_products)                     # 每個性別跑完就先存，中途失敗前面的不會白跑
        print(f"\n已存檔：目前共 {len(all_products)} 件")

    if args.tree:
        return

    print("\n=== 完成 ===")
    for g, n in counts.items():
        print(f"{g}：{n} 件")
    print(f"SKU ：{sum(len(p['variants']) for p in all_products)} 筆")
    print(f"圖片：{len(stats['images'])} 張")
    print(f"重複略過：{stats['skipped_dup']}，失敗：{stats['failed']}")
    print(f"JSON：{JSON_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
