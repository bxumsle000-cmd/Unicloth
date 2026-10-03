# Product API（搜尋商品 / 商品詳細頁）

- Controller：`controller/ProductController.java`
- Service：`service/ProductService.java`
- 共同前綴：`/api/products`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 搜尋商品 | GET | `/api/products` | 200 | 商品卡片（分頁） |
| 商品詳細頁 | GET | `/api/products/{slug}` | 200 | 商品資料 + 顏色 / 尺寸 / 庫存 |

這兩支都**不需要登入**，也都**不需要 body**，參數都放在網址上。

**只會查到上架中的商品**（`status = ON_SALE`），已下架的商品搜尋不到，詳細頁也會回 404。

---

## 1. 搜尋商品 `GET /api/products`

用商品**名稱**搜尋。

### Request

範例：

```
GET /api/products?keyword=外套&page=0&size=20&sort=price,asc
```

| 參數 | 型別 | 必填 | 預設 | 說明 |
|---|---|---|---|---|
| `keyword` | string | ❌ | `""` | 搜尋關鍵字，前後空白會被去掉 |
| `page` | number | ❌ | `0` | 第幾頁，**從 0 開始** |
| `size` | number | ❌ | `25` | 一頁幾筆 |
| `sort` | string | ❌ | `id,desc` | 排序，格式 `欄位,方向`，例：`sort=price,asc` |

### 搜尋規則

- 只比對**商品名稱**，不會搜尋描述、分類、顏色。
- 名稱「**包含**」關鍵字就算：搜 `外套` 會找到「DRY-EX防曬連帽外套」。
- **不分大小寫**：搜 `dry` 也找得到「DRY-EX防曬連帽外套」。
- **關鍵字是空的（沒帶、`""`、只有空白）→ 回空頁**，不會撈出全部商品。
- 關鍵字裡的 `%`、`_` 會被當成一般文字，不是萬用字元。

> `sort` 能用的欄位是 `Product` 的欄位名稱（例如 `id`、`price`、`name`）。傳不存在的欄位會出錯，我**推測**會回 500，沒有實際測過。

### Response — 成功 `200 OK`

格式跟「分類底下的商品」（`category.md`）一樣，是 `content` + `page`：

```json
{
  "content": [
    {
      "slug": "men-487511",
      "name": "DRY-EX防曬連帽外套",
      "price": 990,
      "origPrice": null,
      "newArrival": false,
      "hot": false,
      "imageUrl": "img/products/men-487511/col66.jpg"
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 35,
    "totalPages": 2
  }
}
```

`content` 裡每一筆商品卡片：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `slug` | string | 商品字串 id，點進商品頁用 |
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

> 查不到商品、或關鍵字是空的：`content` 是 `[]`、`totalElements` 是 `0`，不會報錯。

### Response — 失敗

這支沒有主動丟出的錯誤。

### 過程中做了什麼

```
前端 GET /api/products?keyword=...
   │
   ▼
① Spring 把網址參數轉成 keyword 和 Pageable
   ├─ 沒帶 keyword → ""
   └─ 沒帶 page / size / sort → 用預設值（0 / 25 / id,desc）
   │
   ▼
② ProductService.getProductsBySearch()
   ├─ 把 keyword 前後空白去掉
   │    └─ 去掉後是空的 → 直接回空頁（不查資料庫）
   ├─ 查「上架中」且「名稱包含 keyword（不分大小寫）」的商品，分頁排序
   └─ 每個 Product 轉成 ProductCardResponse
   │
   ▼
③ 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`products` 表，不會寫入任何資料。

> ⚠️ 觀察到的小地方（不影響目前功能，供參考）：Controller 註解的範例寫 `size=20`，但實際預設值是 `@PageableDefault(size = 25)`。

---

## 2. 商品詳細頁 `GET /api/products/{slug}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `slug` | 路徑 | string | ✅ | 商品字串 id |

範例：`GET /api/products/men-487511`

### Response — 成功 `200 OK`

```json
{
  "slug": "men-487511",
  "name": "DRY-EX防曬連帽外套",
  "description": "※此商品網路獨家尺寸為XS.XXL.3XL.4XL。…",
  "price": 990,
  "origPrice": null,
  "colorOptions": [
    {
      "color": "藍色",
      "imageUrl": "img/products/men-487511/col66.jpg",
      "sizeOptions": [
        { "variantId": 101, "size": "XS", "stock": 14 },
        { "variantId": 107, "size": "S",  "stock": 31 },
        { "variantId": 113, "size": "M",  "stock": 71 }
      ]
    },
    {
      "color": "黑色",
      "imageUrl": "img/products/men-487511/col09.jpg",
      "sizeOptions": [
        { "variantId": 104, "size": "XS", "stock": 57 },
        { "variantId": 110, "size": "S",  "stock": 33 },
        { "variantId": 116, "size": "M",  "stock": 1 },
        { "variantId": 122, "size": "L",  "stock": 0 }
      ]
    }
  ]
}
```

（`variantId` 是示意用的，實際值以資料庫為準；這件商品實際有 6 個顏色、每色 8 個尺寸，這裡只列一部分。）

商品本身：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `slug` | string | 商品字串 id |
| `name` | string | 商品名稱 |
| `description` | string \| null | 商品描述，可能是 `null` |
| `price` | number | 售價 |
| `origPrice` | number \| null | 原價；**有值且大於 `price` 時顯示特價** |
| `colorOptions` | array | 顏色選項，見下表 |

`colorOptions` 每一個顏色：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `color` | string | 顏色名稱，例：`黑色` |
| `imageUrl` | string | 這個顏色的圖片 |
| `sizeOptions` | array | 這個顏色有的尺寸，見下表 |

`sizeOptions` 每一個尺寸（= 一個 SKU）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `variantId` | number | SKU id，**加入購物車時要送這個**（`POST /api/cart` 的 `variantId`） |
| `size` | string | 尺寸，例：`M` |
| `stock` | number | 庫存；**`0` 代表缺貨，前端按鈕要反灰** |

> 缺貨（`stock = 0`）的尺寸**也會出現**，不會被過濾掉。

**順序：**
- 顏色：照「這個顏色的 SKU 第一次出現」的順序。
- 尺寸：照 SKU id 由小到大。目前資料是照尺寸由小到大匯入的，所以通常是 XS → S → M…，但程式本身沒有特別排尺寸。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | `slug` 找不到商品，**或商品已下架** | `找不到商品：{slug}`，例：`找不到商品：men-487511` |

### 過程中做了什麼

```
前端 GET /api/products/{slug}
   │
   ▼
① ProductService.getProductDetail()
   ├─ 用 slug 查「上架中」的商品（findOnSaleBySlug）
   │    └─ 查不到或已下架 → 404「找不到商品：{slug}」
   ├─ 查這件商品的所有 SKU，照 id 由小到大
   └─ ProductDetailResponse.from()：把 SKU 依顏色分組
        ├─ 同顏色的 SKU 放在一起
        ├─ 每個顏色的圖片取第一個 SKU 的圖片
        └─ 每個 SKU 轉成一個 SizeOption（variantId、size、stock）
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 只有「讀」`products`、`product_variants` 表，不會寫入任何資料。

**依顏色分組的手動推演**

資料庫查出來的 SKU（照 id 排好）：

| id | 顏色 | 尺寸 |
|---|---|---|
| 101 | 藍色 | XS |
| 104 | 黑色 | XS |
| 107 | 藍色 | S |
| 110 | 黑色 | S |

一筆一筆放進「顏色 → SKU 清單」：

| 步驟 | 處理的 SKU | 分組結果 |
|---|---|---|
| 1 | 藍色 XS | `藍色: [XS]` |
| 2 | 黑色 XS | `藍色: [XS]`、`黑色: [XS]` |
| 3 | 藍色 S | `藍色: [XS, S]`、`黑色: [XS]` |
| 4 | 黑色 S | `藍色: [XS, S]`、`黑色: [XS, S]` |

藍色先出現，所以排在黑色前面。程式用 `LinkedHashMap` 保持「第一次放進去的順序」，相當於 Python 3.7 以後的一般 `dict`。
