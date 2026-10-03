# Category API（導覽選單 / 分類頁 / 分類商品）

- Controller：`controller/CategoryController.java`
- Service：`service/CategoryService.java`
- 共同前綴：`/api/categories`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 導覽選單 | GET | `/api/categories` | 200 | 第 1 層分類（各帶第 2 層） |
| 分類頁的下一層按鈕 | GET | `/api/categories/{code}` | 200 | 這個分類 + 下一層分類 |
| 麵包屑 | GET | `/api/categories/{code}/breadcrumb` | 200 | 從第 1 層到自己的分類清單 |
| 分類底下的商品 | GET | `/api/categories/{code}/products` | 200 | 商品卡片（分頁） |
| 篩選選項 | GET | `/api/categories/{code}/filters` | 200 | 顏色、尺寸清單 |

這五支都**不需要登入**，也都**不需要 body**，參數都放在網址上。

**分類的結構**：分類有 3 或 4 層，例如 `男裝 › T恤/背心 › T恤/背心 › 長袖`，商品只掛在最底層。

**`{code}` 是什麼？** 每個分類的固定代碼，例如 `all_men-tops-t-shirts`。前端網址和 API 都用 `code`，不用 id（因為「男裝」和「女裝」底下都有「大衣」，用名稱會分不出來）。

---

## 1. 導覽選單 `GET /api/categories`

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  {
    "code": "all_men",
    "name": "男裝",
    "iconUrl": null,
    "children": [
      {
        "code": "all_men-outer",
        "name": "外套類",
        "iconUrl": "img/categories/icon-all_men-outer.jpg",
        "children": []
      },
      {
        "code": "all_men-tops",
        "name": "T恤/背心/休閒",
        "iconUrl": "img/categories/icon-all_men-tops.jpg",
        "children": []
      }
    ]
  },
  {
    "code": "all_women",
    "name": "女裝",
    "iconUrl": null,
    "children": [ ... ]
  }
]
```

（只列出部分分類，實際內容以資料庫為準。）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `code` | string | 分類代碼 |
| `name` | string | 顯示名稱 |
| `iconUrl` | string \| null | 分類小圖示；**目前只有第 2 層有**，其他層是 `null` |
| `children` | array | 下一層分類，欄位跟外層一樣；第 2 層的 `children` 固定是空陣列 `[]` |

### Response — 失敗

這支沒有主動丟出的錯誤。資料庫裡沒有分類時，回空陣列 `[]`。

### 過程中做了什麼

```
前端 GET /api/categories
   │
   ▼
① CategoryService.getMenu()
   ├─ 查出所有第 1 層分類（parent 是 null 的），照 id 由小到大
   ├─ 對每個第 1 層分類，再查它底下的第 2 層，照 id 由小到大
   └─ 組成「第 1 層 + children」的清單
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`categories` 表，不會寫入任何資料。

> 只往下帶一層（第 1 層帶第 2 層），第 3、4 層不會出現在這裡。

---

## 2. 分類頁的下一層按鈕 `GET /api/categories/{code}`

進入某個分類頁時，上方要顯示的「下一層」篩選按鈕。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `code` | 路徑 | string | ✅ | 分類代碼 |

範例：`GET /api/categories/all_men-tops`

### Response — 成功 `200 OK`

```json
{
  "code": "all_men-tops",
  "name": "T恤/背心/休閒",
  "children": [
    {
      "code": "all_men-tops-t-shirts",
      "name": "T恤/背心",
      "iconUrl": null,
      "children": []
    },
    {
      "code": "all_men-tops-fleece",
      "name": "刷毛",
      "iconUrl": null,
      "children": []
    }
  ]
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `code` | string | 這個分類的代碼 |
| `name` | string | 這個分類的名稱 |
| `children` | array | 下一層分類，格式同「導覽選單」裡的分類；`children` 固定是空陣列 |

> 這個分類已經是最底層時，`children` 是空陣列 `[]`，不會報錯。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | `code` 找不到對應的分類 | `找不到分類：{code}`，例：`找不到分類：abc` |

### 過程中做了什麼

```
前端 GET /api/categories/{code}
   │
   ▼
① CategoryService.getSubcategories()
   ├─ 用 code 查分類（findByCode）
   │    └─ 查不到 → 404「找不到分類：{code}」
   ├─ 查它底下的下一層分類，照 id 由小到大
   └─ 組成 CategoryDetailResponse(code, name, children)
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 只有「讀」`categories` 表，不會寫入任何資料。

---

## 3. 麵包屑 `GET /api/categories/{code}/breadcrumb`

分類頁上方的「男裝 › T恤/背心 › 長袖」。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `code` | 路徑 | string | ✅ | 分類代碼（通常是目前所在的分類） |

範例：`GET /api/categories/all_men-tops-t-shirts-anchor01`

### Response — 成功 `200 OK`

```json
[
  { "code": "all_men", "name": "男裝" },
  { "code": "all_men-tops", "name": "T恤/背心/休閒" },
  { "code": "all_men-tops-t-shirts", "name": "T恤/背心" },
  { "code": "all_men-tops-t-shirts-anchor01", "name": "長袖" }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `code` | string | 分類代碼，點下去要連到的分類頁 |
| `name` | string | 顯示名稱 |

> 順序固定是**第 1 層在最前面，自己在最後面**。傳第 1 層的 code，就只回一格。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | `code` 找不到對應的分類 | `找不到分類：{code}` |

### 過程中做了什麼

```
前端 GET /api/categories/{code}/breadcrumb
   │
   ▼
① CategoryService.getBreadcrumb()
   ├─ 用 code 查分類（findByCode）
   │    └─ 查不到 → 404「找不到分類：{code}」
   └─ 從自己開始，一路往 parent 爬到第 1 層
        每爬一層就「插到清單最前面」→ 最後順序就是由上到下
   │
   ▼
② 回 200 + JSON 陣列
```

手動推演一次（以「長袖」為例）：

| 步驟 | 目前分類 | 清單 |
|---|---|---|
| 1 | 長袖 | `[長袖]` |
| 2 | T恤/背心 | `[T恤/背心, 長袖]` |
| 3 | T恤/背心/休閒 | `[T恤/背心/休閒, T恤/背心, 長袖]` |
| 4 | 男裝 | `[男裝, T恤/背心/休閒, T恤/背心, 長袖]` |
| 5 | （男裝的 parent 是 null，停止） | |

**資料庫影響：** 只有「讀」`categories` 表，不會寫入任何資料。

---

## 4. 分類底下的商品 `GET /api/categories/{code}/products`

### Request

全部都放在網址上，**除了 `code` 以外都可以省略**。

範例：

```
GET /api/categories/all_men-tops/products?page=0&size=20&colors=黑色&colors=白色&sizes=M&minPrice=500&maxPrice=1500&sort=price,asc
```

**篩選條件**（`dto/category/ProductFilterRequest.java`）

| 參數 | 型別 | 必填 | 規則 / 說明 |
|---|---|---|---|
| `code` | string（路徑） | ✅ | 分類代碼，**哪一層都可以** |
| `colors` | string，可重複 | ❌ | 顏色。多選就重複寫：`colors=黑色&colors=白色`，符合其中一個就算 |
| `sizes` | string，可重複 | ❌ | 尺寸。多選寫法同上，符合其中一個就算 |
| `minPrice` | number | ❌ | 最低售價（**含**），必須 ≥ 0 |
| `maxPrice` | number | ❌ | 最高售價（**含**），必須 ≥ 0 |

> `colors`、`sizes` 的值要跟「篩選選項」API 回傳的**一字不差**。

**分頁 / 排序**（Spring 的 `Pageable`）

| 參數 | 型別 | 預設 | 說明 |
|---|---|---|---|
| `page` | number | `0` | 第幾頁，**從 0 開始** |
| `size` | number | `25` | 一頁幾筆 |
| `sort` | string | `id,desc` | 排序，格式 `欄位,方向`，例：`sort=price,asc` |

> `sort` 能用的欄位是 `Product` 的欄位名稱（例如 `id`、`price`、`name`）。傳不存在的欄位會出錯，我**推測**會回 500，沒有實際測過。

### 篩選規則

- 沒帶的條件就不篩，**全部沒帶 = 這個分類的全部商品**。
- **只會出現上架中的商品**（`status = ON_SALE`）。
- **包含底下所有子孫分類的商品**：傳第 2 層的 code，第 3、4 層的商品都會出現。
- 顏色和尺寸同時選時，要**同一個 SKU** 同時符合才算。
  例：選「黑色 + M」，商品要有「黑色 M 號」這個 SKU；只有「黑色 L」和「白色 M」的商品**不算**。
- 價格是看商品的售價 `price`，不是原價。
- `minPrice` 比 `maxPrice` 大時不會報錯，只會查不到東西。

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "slug": "men-487511",
      "name": "DRY-EX防曬連帽外套",
      "price": 390,
      "origPrice": 590,
      "newArrival": true,
      "hot": false,
      "imageUrl": "img/products/men-487511/col66.jpg"
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 57,
    "totalPages": 3
  }
}
```

`content` 裡每一筆商品卡片：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `slug` | string | 商品的字串 id，點進商品頁時用，例：`men-487511` |
| `name` | string | 商品名稱 |
| `price` | number | 售價 |
| `origPrice` | number \| null | 原價；**有值且大於 `price` 時顯示特價** |
| `newArrival` | boolean | 是否顯示「新品」標籤 |
| `hot` | boolean | 是否顯示「熱門」標籤 |
| `imageUrl` | string \| null | 縮圖，沒有時是 `null` |

`page` 分頁資訊：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `size` | number | 一頁幾筆 |
| `number` | number | 目前第幾頁（從 0 開始） |
| `totalElements` | number | 符合條件的商品總數 |
| `totalPages` | number | 總頁數 |

> 分頁的格式是 `content` + `page`，這是因為 `application.properties` 設了 `spring.data.web.pageable.serialization-mode=via_dto`。
> 查不到商品時：`content` 是 `[]`、`totalElements` 是 `0`，不會報錯。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `minPrice` 或 `maxPrice` 是負數 | 例：`minPrice: 必須大於或等於 0` |
| 404 | `code` 找不到對應的分類 | `找不到分類：{code}` |

> `minPrice=abc` 這種「不是數字」的情況，我**推測**也會回 400，但 `message` 可能是一段 Spring 產生的英文轉型錯誤訊息，沒有實際測過，以實際回應為準。

### 過程中做了什麼

```
前端 GET /api/categories/{code}/products?...
   │
   ▼
① Spring 把網址參數轉成 ProductFilterRequest 和 Pageable
   ├─ 沒帶 page / size / sort → 用預設值（0 / 25 / id,desc）
   └─ @Valid 檢查 minPrice、maxPrice ≥ 0
        └─ 沒過 → 400
   │
   ▼
② CategoryService.getProducts()
   ├─ 找出「自己 + 底下所有子孫分類」的 id
   │    ├─ 用 code 查分類 → 查不到 → 404「找不到分類：{code}」
   │    ├─ 一次把全部分類撈進記憶體，整理成「parent id → 子分類們」
   │    └─ 從自己開始往下一層一層收集 id（不管幾層都收得到）
   ├─ 判斷 colors / sizes 有沒有選
   └─ 用一條查詢一次做完：
        分類 id 在清單內 + 上架中 + 價格範圍 + 顏色/尺寸（同一個 SKU）+ 分頁排序
   │
   ▼
③ 每個 Product 轉成 ProductCardResponse
   │
   ▼
④ 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`categories`、`products`、`product_variants` 表，不會寫入任何資料。

**補充：為什麼要一次撈出全部分類？**
分類只有幾百筆，一次全部撈進記憶體再往下找，只需要查一次資料庫。如果每往下一層就查一次，4 層就要查好幾次。

---

## 5. 篩選選項 `GET /api/categories/{code}/filters`

分類頁左側（或上方）的顏色、尺寸篩選清單。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `code` | 路徑 | string | ✅ | 分類代碼，哪一層都可以 |

範例：`GET /api/categories/all_men-tops/filters`

### Response — 成功 `200 OK`

```json
{
  "colors": ["黑色", "白色", "海軍藍"],
  "sizes": ["S", "M", "L", "XL"]
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `colors` | string[] | 這個分類的商品實際有的顏色（不重複） |
| `sizes` | string[] | 這個分類的商品實際有的尺寸（不重複） |

> 選項**不是寫死的**，是依照這個分類底下上架中的商品，實際有哪些 SKU 算出來的。
> 值是資料庫原樣，前端呼叫「分類底下的商品」時要原封不動帶回去。
> 這個分類沒有商品時，兩個都是空陣列 `[]`。

> 後端回傳的順序不固定，前端 `products.html` 的 `sortSizes()` 會自己排成 S → M → L。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | `code` 找不到對應的分類 | `找不到分類：{code}` |

### 過程中做了什麼

```
前端 GET /api/categories/{code}/filters
   │
   ▼
① CategoryService.getFilterOptions()
   ├─ 找出「自己 + 底下所有子孫分類」的 id（跟「分類底下的商品」同一套）
   │    └─ code 查不到 → 404「找不到分類：{code}」
   ├─ 查這些分類底下、上架中商品的 SKU，出現過的所有顏色（不重複）
   └─ 同上，出現過的所有尺寸（不重複）
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 只有「讀」`categories`、`products`、`product_variants` 表，不會寫入任何資料。

> 補充：選項的範圍跟「分類底下的商品」一樣，所以使用者點了任一個選項，至少會查到一件商品（只選單一條件時）。
> 庫存是 0 的 SKU 也會算進來，因為查詢沒有看庫存。
