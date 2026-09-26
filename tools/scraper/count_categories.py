"""
只查數量、不抓商品：官網每個大類（第 2 層）和最細層各有多少件商品，
並跟 products.json 裡實際收了幾件放在一起比較。

用法（在專案根目錄執行）：
  python tools/scraper/count_categories.py

查哪些分類：products.json 裡出現過的第 2 層大類，從官網一路往下展開到最細層。
  - 最細層的名稱後面括號是它原本的中間層，例如「長袖（休閒襯衫）」，
    因為 regroup_categories.py 會把同一大類底下同名的細類合併。
  - 官網件數是列表 API 的 productSum（查詢條件 stockFilter=warehouse，跟爬蟲一樣）。
  - 一件商品可以同時掛在好幾個細類，所以細類加總通常會大於大類的件數。
  - 「收」表示 products.json 裡有這個細類（用大類 + 細類名稱比對）。
"""

import random
import sys
import time
from collections import Counter
from pathlib import Path
import json

import requests

PROJECT_ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = PROJECT_ROOT / "src/main/resources/data/products.json"
API_LIST = "https://d.uniqlo.com/tw/p/search/products/by-category"
LEVEL_KEYS = ["topCategory", "levelOneCategory", "levelTwoCategory", "levelThreeCategory"]
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
    "Origin": "https://www.uniqlo.com",
    "Referer": "https://www.uniqlo.com/tw/zh_TW/",
}


def fetch_node(code: str) -> tuple[int, list[dict]]:
    """回傳 (這個分類的商品數, 下一層子分類)"""
    body = {
        "pageInfo": {"page": 1, "pageSize": 1}, "belongTo": "pc", "rank": "overall",
        "priceRange": {"low": 0, "high": 0}, "color": [], "size": [], "identity": [], "exist": [],
        "categoryCode": code, "searchFlag": False, "description": "", "stockFilter": "warehouse",
    }
    r = requests.post(API_LIST, json=body, headers=HEADERS, timeout=20)
    r.raise_for_status()
    time.sleep(random.uniform(1.0, 2.0))
    resp = r.json()["resp"][0]
    cond = next(c for c in resp["conditionList"] if c.get("code") == "categoryDesc")
    level = next(i for i, k in enumerate(LEVEL_KEYS) if any(x["code"] == code for x in cond[k]))
    children = []
    if level + 1 < len(LEVEL_KEYS):
        children = [{"code": x["code"], "name": x["name"]} for x in cond[LEVEL_KEYS[level + 1]] if x["code"] != code]
    return int(resp.get("productSum") or 0), children


def main():
    products = json.loads(JSON_PATH.read_text(encoding="utf-8"))

    # products.json 裡的大類（保持出現順序）和每個細類收了幾件
    level2_list: dict[str, tuple[str, str]] = {}          # 大類代碼 → (性別, 大類名稱)
    ours_l2 = Counter()
    ours_leaf = Counter()
    for p in products:
        gender, big, leaf = p["categoryPath"]
        l2 = p["categoryCode"][1]
        level2_list.setdefault(l2, (gender, big))
        ours_l2[l2] += 1
        ours_leaf[(l2, leaf)] += 1

    print("官網件數 / 我們收的件數\n")
    for l2, (gender, big) in level2_list.items():
        total, l3s = fetch_node(l2)
        print(f"■ {gender} › {big}　官網 {total} 件 / 我們 {ours_l2[l2]} 件")
        leaves = []                                          # (顯示名稱, 細類名稱, 官網件數)
        for l3 in l3s:
            n3, l4s = fetch_node(l3["code"])
            if not l4s:
                leaves.append((l3["name"], l3["name"], n3))
            for l4 in l4s:
                n4, _ = fetch_node(l4["code"])
                leaves.append((f"{l4['name']}（{l3['name']}）", l4["name"], n4))
        for label, name, n in leaves:
            mine = ours_leaf.get((l2, name), 0)
            mark = "收" if (l2, name) in ours_leaf else "　"
            print(f"   [{mark}] {label}　官網 {n} / 我們 {mine}")
        print(flush=True)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
