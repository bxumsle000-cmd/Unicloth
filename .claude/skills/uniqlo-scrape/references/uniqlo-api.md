# Uniqlo 台灣官網 API 筆記

2026-09-19 用瀏覽器 DevTools 攔截官網（SPA）所得。官網 HTML 是空殼，所有資料都從 `d.uniqlo.com` 的 JSON API 來。
這些 API 不需要登入或 cookie，帶一般的 `User-Agent` 和 `Origin: https://www.uniqlo.com` 即可。

## 1. 分類商品列表

```
POST https://d.uniqlo.com/tw/p/search/products/by-category
Content-Type: application/json
```

Body（官網原樣，只改 `categoryCode` 和 `pageSize`）：

```json
{
  "pageInfo": {"page": 1, "pageSize": 24},
  "belongTo": "pc",
  "rank": "overall",
  "priceRange": {"low": 0, "high": 0},
  "color": [], "size": [], "identity": [], "exist": [],
  "categoryCode": "all_women-outer",
  "searchFlag": false,
  "description": "",
  "stockFilter": "warehouse"
}
```

回傳 `resp[0]`：

| 欄位 | 意義 |
|---|---|
| `categoryTitleName` | 分類顯示名稱，例如「女裝 外套類」 |
| `productSum` | 分類總商品數 |
| `productList[]` | 商品列表，每筆重點欄位如下 |

`productList[]` 每筆：

| 欄位 | 例子 | 用途 |
|---|---|---|
| `productCode` | `u0000000054422` | API 用的代碼，明細與圖片網址都用它 |
| `code` | `487396` | 人看的 6 位商品編號，slug 用它 |
| `name` | `防潑水連帽外套` | 商品名（明細的 `summary.name` 會多帶編號） |
| `minPrice` / `originPrice` | `1490` | 價格 |
| `mainPic` | `/hmall/test/u0000000054422/main/first/561/1.jpg` | 商品主圖（不分顏色），當備援 |
| `colorPic[]` | `/hmall/test/.../sku/225/COL09.jpg` | 各顏色小圖（225px） |
| `sex` | `女裝` | |

分類代碼不存在時 `success` 仍是 true，但 `productList` 是空的。

## 2. 商品明細（SKU、價格、庫存）

```
GET https://d.uniqlo.com/tw/p/product/detail?productCode=u0000000055012&distribution=EXPRESS&type=DETAIL
```

回傳 `resp[0]`：

```
spuInfo.summary   商品層級資訊
spuInfo.rows[]    每個「顏色 × 尺寸」一筆（SKU）
spuInfo.desc      各說明頁的 HTML 路徑
stockInfo         庫存
imageInfo         圖片清單
```

`spuInfo.summary` 重點：

| 欄位 | 例子 |
|---|---|
| `productCode` | `u0000000055012` |
| `code` | `487406` |
| `name` | `PUFFTECH 輕暖科技連帽外套 478571`（後面帶編號，有時多組 `479800 / 479781 /`） |
| `originPrice` | `1990` |
| `isNew` | `"Y"` / `"N"` |
| `sex` | `女裝` |
| `categories[]` / `categoryNames[]` | 所屬分類代碼與名稱 |

`spuInfo.rows[]` 每筆：

| 欄位 | 例子 | 用途 |
|---|---|---|
| `productId` | `u0000000055012049` | SKU 代碼，查庫存的 key |
| `colorNo` | `COL30` | 色號，圖片檔名與網址用 |
| `styleText` | `478571 / 30 NATURAL` 或 `57 OLIVE` | 唯一有顏色名稱的地方，**只有英文** |
| `sizeText` | `XS` | 尺寸 |
| `varyPrice` / `price` | `1990` | 目前售價 / 原價 |
| `enabledFlag` | `"Y"` | N 的不要收 |

`stockInfo`：

| 欄位 | 意義 |
|---|---|
| `skuStocks` | `{productId: 數量}`，總庫存，爬蟲用這個 |
| `expressSkuStocks` | 快速配送倉庫存 |
| `hasStock` | `"Y"` / `"N"` |

`spuInfo.desc`：值是 HTML 路徑，前面加 `https://www.uniqlo.com/tw`。
商品說明用 `instruction`（例如 `/hmall/test/u0000000055012/zh_TW/instruction.html`），其他還有 `features`、`materialCare`、`sizeAndTryOn`。

## 3. 圖片

前綴一律 `https://www.uniqlo.com/tw`。

| 用途 | 路徑規則 | 備註 |
|---|---|---|
| 各顏色主圖（爬蟲用） | `/hmall/test/{productCode}/sku/561/{COLxx}.jpg` | 561px 寬，約 130KB |
| 各顏色大圖 | `/hmall/test/{productCode}/sku/1000/{COLxx}.jpg` | 1000px，約 360KB |
| 商品主圖（不分色） | `/hmall/test/{productCode}/main/first/561/1.jpg` | 備援用 |
| 色票小圖 | `/hmall/test/{productCode}/chip/22/{COLxx}.jpg` | 22px |

注意 `sku/480/` 不存在（404），只有 561 和 1000。

## 4. 其他觀察到但沒用的 API

- `GET /tw/p/search/categories/same-level/{categoryCode}`：同層分類列表
- `POST /tw/p/review/comment/guest/list`：評價，body `{"page":1,"productCode":"...","pageSize":3,"orderBy":"createDate"}`
- `GET /tw/p/product/styling/list`：穿搭

## 5. 用 curl 快速測試

```bash
curl -s -A "Mozilla/5.0" -H "Content-Type: application/json" -H "Origin: https://www.uniqlo.com" \
  -X POST "https://d.uniqlo.com/tw/p/search/products/by-category" \
  -d '{"pageInfo":{"page":1,"pageSize":2},"belongTo":"pc","rank":"overall","priceRange":{"low":0,"high":0},"color":[],"size":[],"identity":[],"exist":[],"categoryCode":"all_women-outer","searchFlag":false,"description":"","stockFilter":"warehouse"}'

curl -s -A "Mozilla/5.0" -H "Origin: https://www.uniqlo.com" \
  "https://d.uniqlo.com/tw/p/product/detail?productCode=u0000000055012&distribution=EXPRESS&type=DETAIL"
```

## 6. 如果 API 壞了怎麼重新探索

用 Chrome 開分類頁，在 Console 執行：

```js
performance.getEntriesByType('resource')
  .filter(e => ['fetch','xmlhttprequest'].includes(e.initiatorType))
  .map(e => new URL(e.name).pathname)
```

就會列出頁面打過的 API 路徑。POST 的 body 要在載入前掛攔截器（覆寫 `XMLHttpRequest.prototype.send` 與 `window.fetch` 把 body 存到 `window.__cap`），再用 SPA 內部連結切頁觸發請求。
