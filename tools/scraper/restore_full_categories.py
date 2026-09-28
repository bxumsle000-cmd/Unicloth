"""
把 regroup_categories.py 拿掉的官網第 3 層補回來，products.json 變成官網完整分類（3 或 4 層），不用重爬商品。

  現在    男裝 › T恤/背心/休閒 › 長袖              （官網第 3 層「T恤/背心」被拿掉了）
  補回後  男裝 › T恤/背心/休閒 › T恤/背心 › 長袖   （官網 4 層）
  不變    男裝 › 下身類 › 卡其褲                    （官網本來就只有 3 層）

資料來源：regroup 之前的備份（tools/scraper/backup/），裡面的中間層就是官網第 3 層（或沒有第 3 層時的第 2 層），
細類代碼也是官網原本的代碼（regroup 時同名細類被合併成同一個代碼，這裡一併還原）。
商品、SKU、圖片、alsoIn 都不動，只改 categoryPath / categoryCode。

用法（在專案根目錄執行）：
  python tools/scraper/restore_full_categories.py            # 改寫 products.json（原檔先備份到 tools/scraper/backup/）
  python tools/scraper/restore_full_categories.py --dry-run  # 只印結果，不寫檔
  python tools/scraper/verify_products.py
"""

import argparse
import json
import shutil
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = PROJECT_ROOT / "src/main/resources/data/products.json"
BACKUP_DIR = Path(__file__).resolve().parent / "backup"
SOURCE = BACKUP_DIR / "products-20260926-235805.json"   # regroup 之前的版本


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="只印結果，不寫檔")
    args = ap.parse_args()

    products = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    old = {p["slug"]: p for p in json.loads(SOURCE.read_text(encoding="utf-8"))}

    missing = [p["slug"] for p in products if p["slug"] not in old]
    if missing:
        raise SystemExit(f"備份裡找不到這些商品，沒辦法補：{missing}")

    for p in products:
        o = old[p["slug"]]
        gender_code, l2_code = p["categoryCode"][:2]
        gender_name, l2_name = p["categoryPath"][:2]
        _, mid_code, leaf_code = o["categoryCode"]
        _, mid_name, leaf_name = o["categoryPath"]
        if mid_code == l2_code:                                   # 官網沒有第 3 層
            p["categoryCode"] = [gender_code, l2_code, leaf_code]
            p["categoryPath"] = [gender_name, l2_name, leaf_name]
        else:
            p["categoryCode"] = [gender_code, l2_code, mid_code, leaf_code]
            p["categoryPath"] = [gender_name, l2_name, mid_name, leaf_name]

    # 同一個代碼一定要對到同一個名稱、同一個上層，不然 DataSeeder 用 code 找分類時會掛錯地方
    node: dict[str, tuple] = {}
    for p in products:
        codes, names = p["categoryCode"], p["categoryPath"]
        for i, code in enumerate(codes):
            info = (names[i], codes[i - 1] if i else None)
            if node.setdefault(code, info) != info:
                raise SystemExit(f"代碼 {code} 對到兩種分類：{node[code]} / {info}")

    # 印結果
    tree: dict[tuple, Counter] = defaultdict(Counter)
    for p in products:
        tree[tuple(p["categoryPath"][:-1])][p["categoryPath"][-1]] += 1
    for parent, leaves in sorted(tree.items()):
        print(f"{' › '.join(parent)}")
        print("   " + "、".join(f"{name} {n}" for name, n in leaves.items()))
    depth = Counter(len(p["categoryCode"]) for p in products)
    print(f"\n商品 {len(products)} 件：4 層 {depth[4]} 件、3 層 {depth[3]} 件；分類節點 {len(node)} 個")

    if args.dry_run:
        print("\n（--dry-run，沒有寫檔）")
        return

    backup = BACKUP_DIR / f"products-{datetime.now():%Y%m%d-%H%M%S}.json"
    shutil.copy2(JSON_PATH, backup)
    JSON_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n原檔備份：{backup.relative_to(PROJECT_ROOT)}")
    print(f"已改寫　：{JSON_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
