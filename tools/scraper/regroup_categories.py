"""
把 products.json 的三層分類從「官網第一層 › 倒數第二層 › 最後一層」
改成「官網第一層 › 第二層 › 最後一層」，不用重爬商品。

  改之前  男裝 › T恤/背心 › 長袖        （中間是官網第 3 層，太細）
  改之後  男裝 › T恤/背心/休閒 › 長袖   （中間是官網第 2 層）

做法：
  - 官網第 2 層的代碼一定是「{性別}-{大類後綴}」，例如 all_men-tops，
    而中間代碼 all_men-tops-t-shirts 就是用它開頭，所以從代碼就能找回第 2 層。
  - 第 2 層的中文名稱：每個性別打 1 次列表 API 拿（共 3 次，不抓商品）。
  - 合併之後，同一個大類底下可能有同名細類（襯衫 › 長袖 來自休閒襯衫和正式襯衫），
    同名的合併成一個，細類代碼統一用排序後第一個，不然 DataSeeder 會建出兩個都叫「長袖」的分類。
  - alsoIn 是爬的時候用舊的群組算的，不重爬沒辦法重算，維持原樣。

用法（在專案根目錄執行）：
  python tools/scraper/regroup_categories.py            # 改寫 products.json（原檔先備份到 tools/scraper/backup/）
  python tools/scraper/regroup_categories.py --dry-run  # 只印結果，不寫檔
  python tools/scraper/verify_products.py
"""

import argparse
import json
import shutil
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = PROJECT_ROOT / "src/main/resources/data/products.json"
BACKUP_DIR = Path(__file__).resolve().parent / "backup"
API_LIST = "https://d.uniqlo.com/tw/p/search/products/by-category"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
    "Origin": "https://www.uniqlo.com",
    "Referer": "https://www.uniqlo.com/tw/zh_TW/",
}


def fetch_level2_names(gender_code: str) -> dict[str, str]:
    """官網分類篩選器裡，性別（topCategory）的下一層 levelOneCategory 就是第 2 層大類"""
    body = {
        "pageInfo": {"page": 1, "pageSize": 1}, "belongTo": "pc", "rank": "overall",
        "priceRange": {"low": 0, "high": 0}, "color": [], "size": [], "identity": [], "exist": [],
        "categoryCode": gender_code, "searchFlag": False, "description": "", "stockFilter": "warehouse",
    }
    r = requests.post(API_LIST, json=body, headers=HEADERS, timeout=20)
    r.raise_for_status()
    cond = next(c for c in r.json()["resp"][0]["conditionList"] if c.get("code") == "categoryDesc")
    return {x["code"]: x["name"] for x in cond["levelOneCategory"]}


def find_level2(mid_code: str, level2_codes) -> str:
    """all_men-tops-t-shirts → all_men-tops；本身就是第 2 層的直接回傳"""
    candidates = [c for c in level2_codes if mid_code == c or mid_code.startswith(c + "-")]
    if not candidates:
        raise ValueError(f"找不到 {mid_code} 屬於哪個大類")
    return max(candidates, key=len)   # all_men-tops 和 all_men-tops-xxx 都對得到時，取比較長（比較具體）的


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="只印結果，不寫檔")
    args = ap.parse_args()

    products = json.loads(JSON_PATH.read_text(encoding="utf-8"))

    # 官網第 2 層的代碼與中文名稱：每個性別打 1 次 API
    level2_names: dict[str, str] = {}
    for gender_code in sorted({p["categoryCode"][0] for p in products}):
        print(f"抓 {gender_code} 的大類名稱…")
        level2_names.update(fetch_level2_names(gender_code))

    # 第一輪：算出每件商品的新大類；同一個大類底下同名的細類，收集它們的代碼
    leaf_codes: dict[tuple[str, str, str], set[str]] = defaultdict(set)
    new_level2: dict[str, str] = {}
    for p in products:
        gender_code, mid_code, leaf_code = p["categoryCode"]
        l2 = find_level2(mid_code, level2_names)
        new_level2[p["slug"]] = l2
        leaf_codes[(gender_code, l2, p["categoryPath"][2])].add(leaf_code)

    # 同名細類統一用排序後第一個代碼
    canonical = {key: sorted(codes)[0] for key, codes in leaf_codes.items()}

    # 第二輪：改寫
    for p in products:
        gender_code = p["categoryCode"][0]
        leaf_name = p["categoryPath"][2]
        l2 = new_level2[p["slug"]]
        p["categoryPath"] = [p["categoryPath"][0], level2_names[l2], leaf_name]
        p["categoryCode"] = [gender_code, l2, canonical[(gender_code, l2, leaf_name)]]

    # 印結果
    tree: dict[tuple[str, str], Counter] = defaultdict(Counter)
    for p in products:
        tree[tuple(p["categoryPath"][:2])][p["categoryPath"][2]] += 1
    for (gender, big), leaves in tree.items():
        print(f"\n{gender} › {big}（{len(leaves)} 個細類）")
        print("   " + "、".join(f"{name} {n}" for name, n in leaves.items()))
    merged = {k: v for k, v in leaf_codes.items() if len(v) > 1}
    print(f"\n大類 {len(tree)} 個，細類 {len(leaf_codes)} 個，其中 {len(merged)} 個是同名合併的")

    if args.dry_run:
        print("\n（--dry-run，沒有寫檔）")
        return

    BACKUP_DIR.mkdir(exist_ok=True)
    backup = BACKUP_DIR / f"products-{datetime.now():%Y%m%d-%H%M%S}.json"
    shutil.copy2(JSON_PATH, backup)
    JSON_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n原檔備份：{backup.relative_to(PROJECT_ROOT)}")
    print(f"已改寫　：{JSON_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
