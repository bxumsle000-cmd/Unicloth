---
name: uniqlo-scrape
description: 從 Uniqlo 台灣官網爬商品資料與圖片進這個專案（tools/scraper/uniqlo_scraper.py），產出 static/img/products/ 的圖片和 data/products.json。只要使用者提到「爬 Uniqlo」「抓商品」「加分類」「重爬」「商品圖片」「products.json」「童裝/女裝/男裝的外套/T恤/褲子…要加進來」，或任何要從 Uniqlo 取得商品、SKU、圖片、庫存的需求，就用這個 skill，不要重新探索官網 API 或重寫爬蟲——流程和 API 都已經確認過了。
---

# Uniqlo 商品爬蟲

爬蟲已經寫好、API 已經探索過。這個 skill 的目的是讓你**不用重新探索**，照固定流程把新分類加進來，並確保產出的資料能直接進資料庫。

## 資料流程（先搞清楚自己在哪一步）

```
Uniqlo API ──爬蟲──▶ static/img/products/{slug}/{colorKey}.jpg
                  └──▶ data/products.json ──verify──▶ DataSeeder ──▶ SQL Server
```

相關檔案：

| 檔案 | 用途 |
|---|---|
| `tools/scraper/uniqlo_scraper.py` | 爬蟲本體。要爬哪些分類在頂端的 `CATEGORIES` |
| `tools/scraper/verify_products.py` | 檢查 JSON 與圖片一致、不會撞資料庫 UNIQUE |
| `src/main/resources/data/products.json` | 爬蟲輸出，欄位對應 `products` / `product_variants` 表 |
| `src/main/resources/static/img/products/` | 商品圖，一個商品一個資料夾（slug），一個顏色一張圖 |
| `src/main/resources/db/migration/V1__init.sql` | 資料表定義，JSON 欄位就是照它設計的 |

## 環境

這台電腦的 `python` 指令會被 Windows 商店的空殼攔截，一律用完整路徑：

```
C:\Users\User\AppData\Local\Programs\Python\Python313\python.exe
```

套件 `requests`、`beautifulsoup4` 已裝好。組員的電腦若不同，改用他們的 python 即可，需求在 `tools/scraper/requirements.txt`。

## 流程

### 1. 把使用者說的分類轉成 Uniqlo 分類代碼

代碼格式是 `all_{性別}-{類別}`。已確認可用的：

| 使用者會說 | 代碼 |
|---|---|
| 女裝 外套類 | `all_women-outer` |
| 女裝 T恤/背心/休閒上衣 | `all_women-tops` |
| 男裝 外套類 | `all_men-outer` |
| 男裝 T恤/背心/休閒上衣 | `all_men-tops` |
| 童裝 外套類 | `all_kids-outer` |

性別前綴：`all_women` / `all_men` / `all_kids` / `all_baby`。
其他類別代碼從官網分類頁網址取：`https://www.uniqlo.com/tw/zh_TW/c/all_women-outer.html` 的 `all_women-outer` 就是代碼。使用者如果貼網址，直接截。

**不確定的代碼一定先用 `--check` 驗證**，它不會下載任何東西：

```
python tools/scraper/uniqlo_scraper.py --check all_kids-outer
✓ all_kids-outer：「童裝(男童/女童) 外套類」共 21 件
```

回傳的「分類名稱」順便拿來確認跟使用者要的是同一個東西（例如 `all_women-tops` 其實叫「T恤/背心/休閒」，不是只有 T 恤）。

### 2. 加進 `CATEGORIES`

每一列是 `(分類代碼, 主分類, 副分類, slug 前綴)`：

```python
CATEGORIES = [
    ("all_women-outer", "女裝", "外套類", "women"),
    ("all_kids-outer",  "童裝", "外套類", "kids"),    # 新加的
]
```

- 主分類 / 副分類是之後要進 `categories` 表的名字，用使用者的講法，跟既有的保持一致（同一個副分類在不同性別下要用一樣的字）。
- slug 前綴用性別英文：`women` / `men` / `kids` / `baby`。slug 會變成 `kids-475292`，也是圖片資料夾名。
- 已經爬過的分類**不要拿掉**，否則重跑時 `products.json` 會少掉那些商品（JSON 每次整份重寫）。

### 3. 先小量測試

```
python tools/scraper/uniqlo_scraper.py --limit 2
```

看輸出每一行有沒有 `✓`，有 `[失敗]` 或 `[警告]` 先處理。圖片已存在會自動跳過，所以重跑很便宜。

### 4. 正式跑

```
python tools/scraper/uniqlo_scraper.py --limit 10
```

`--limit` 是**每個分類**的商品數，預設 10。使用者沒指定就用 10；要更多先提醒圖片體積（目前約 40 件商品 = 190 張圖 = 24MB，會進 git）。每個 request 停 1～2 秒是刻意的，不要拿掉。

### 5. 驗證

```
python tools/scraper/verify_products.py
```

必須看到 `✓ 全部通過` 才算完成。它檢查的就是資料庫的 UNIQUE 限制：slug、skuCode、同商品的 (color, size) 不重複，以及每個 `url` 真的有檔案。

### 6. 回報

跟使用者說：商品幾件（分分類）、SKU 幾筆、圖片幾張與大小、略過/失敗幾件，以及任何需要他決定的事（例如某分類商品數不足 limit）。

## 已知的資料特性（不是 bug，不要去「修」）

- **顏色只有英文**。台灣站 API 給的是 `30 NATURAL` 這種格式，爬蟲用 `COLOR_ZH` 對照表翻中文，對不到就保留英文（Title Case）。看到新的英文顏色，加進對照表就好。
- **同一件商品可能有兩個色號同名**（COL10、COL12 都是 PINK）。爬蟲會把第二個標成 `粉紅色(12)`，因為資料庫 `UNIQUE(product_id, color, size)` 不允許重複。
- **同一件商品會出現在多個分類**（例如男女適穿）。第一個分類收了，之後的分類會「略過」，統計裡的「略過」數就是這個。
- **庫存是 Uniqlo 的真實數字**，有些上千件。要縮小是匯入 DB 時的事，不是爬蟲的事。
- **`origPrice` 幾乎都是 null**，因為 Uniqlo 平常沒特價。`isHot` 一律 false，留給專題自己設。
- 一個顏色一張圖，同顏色不同尺寸共用。圖片是 561px 寬，不需要再縮。

## 什麼時候要看 references/uniqlo-api.md

爬蟲本身壞掉（API 回傳格式變了、抓不到圖）才需要。裡面記錄了列表 / 明細 / 圖片三個 API 的網址、body、回傳欄位，可以直接用 curl 重現，不用再開瀏覽器攔封包。

## 不要做的事

- 不要手動編輯 `products.json`——下次重跑會整份覆蓋。要改資料就改爬蟲。
- 不要動 `V1__init.sql` 來遷就爬蟲資料；反過來，JSON 要遷就資料表。
- 不要把 `polite_sleep()` 拿掉或把 `--limit` 開到幾百件，這是學校專題不需要那麼多。
- 使用者只說「爬 X 分類」時，不要順便重新設計 JSON 格式或資料夾結構——那些是跟資料庫和 Seeder 綁定的。
