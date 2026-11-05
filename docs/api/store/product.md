# Product API（搜尋商品 / 新品 / 商品詳細頁）

- Controller：`controller/store/ProductController.java`
- Service：`service/shop/ProductService.java`
- 共同前綴：`/api/products`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 搜尋商品 | GET | `/api/products` | 200 | 商品卡片（分頁） |
| 新品 | GET | `/api/products/new-arrivals` | 200 | 商品卡片（分頁） |
| 商品詳細頁 | GET | `/api/products/{slug}` | 200 | 商品資料 + 風格 + 顏色 / 尺寸 / 庫存 |

這三支都**不需要登入**，也都**不需要 body**，參數都放在網址上。

**只會查到上架中的商品**（`status = ON_SALE`），已下架的商品搜尋不到，詳細頁也會回 404。

---

## 1. 搜尋商品 `GET /api/products`

用商品**名稱**或**風格**搜尋。

### Request

範例：

```
GET /api/products?keyword=外套&page=0&size=24&sort=price,asc
```

| 參數 | 型別 | 必填 | 預設 | 說明 |
|---|---|---|---|---|
| `keyword` | string | ❌ | `""` | 搜尋關鍵字，前後空白會被去掉 |
| `page` | number | ❌ | `0` | 第幾頁，**從 0 開始** |
| `size` | number | ❌ | `24` | 一頁幾筆 |
| `sort` | string | ❌ | `id,desc` | 排序，格式 `欄位,方向`，例：`sort=price,asc` |

### 搜尋規則

商品符合下面**任一個**就會出現：

| 順位 | 條件 | 例子 |
|---|---|---|
| 1 | 商品名稱包含關鍵字 | 搜 `外套` → 「DRY-EX防曬連帽外套」 |
| 2 | 商品有「直接符合」的風格：風格的名稱、代碼或搜尋別名包含關鍵字 | 搜 `日系` → 有「日系」標籤的商品 |
| 3 | 商品有「相關」的風格：直接符合的風格，在 `style_relations` 設定的相關風格 | 搜 `日系` → 有日系相關風格標籤的商品 |

- **順位小的排前面**；同一個順位裡，才依 `sort` 排序。
- **不分大小寫**：搜 `dry` 也找得到「DRY-EX防曬連帽外套」。
- 不會搜尋商品描述、分類、顏色。
- **關鍵字是空的（沒帶、`""`、只有空白）→ 回空頁**，不會撈出全部商品。

> `sort` 能用的欄位是 `Product` 的欄位名稱（例如 `id`、`price`、`name`）。傳不存在的欄位回 500 `系統發生錯誤，請稍後再試`。

### Response — 成功 `200 OK`

格式跟「分類底下的商品」（[category.md](category.md)）一樣，是 `content` + `page`：

```json
{
  "content": [
    {
      "slug": "kids-486825",
      "name": "柔軟舒膚針織開襟外套(長袖)",
      "price": 690,
      "origPrice": null,
      "newArrival": false,
      "hot": false,
      "imageUrl": "img/products/kids-486825/col51.jpg",
      "styles": [
        { "id": 2, "code": "natural", "name": "自然風" },
        { "id": 8, "code": "preppy", "name": "學院風" }
      ]
    }
  ],
  "page": {
    "size": 24,
    "number": 0,
    "totalElements": 117,
    "totalPages": 5
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
| `styles` | array | 商品的風格標籤，每一筆是 `{ id, code, name }`，順序不固定；沒有標籤是 `[]` |

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
   └─ 沒帶 page / size / sort → 用預設值（0 / 24 / id,desc）
   │
   ▼
② ProductService.getProductsBySearch()
   ├─ 把 keyword 前後空白去掉
   │    └─ 去掉後是空的 → 直接回空頁（不查資料庫）
   ├─ 查名稱、代碼或別名包含 keyword 的風格（直接風格）
   ├─ 有直接風格 → 再查它們的相關風格，並去掉跟直接風格重複的
   ├─ 查上架中、符合三個條件其中之一的商品，依順位 + sort 排序、分頁
   └─ 每個 Product 轉成 ProductCardResponse
   │
   ▼
③ 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`products`、`styles`、`style_aliases`、`style_relations`、`product_styles` 表，不會寫入任何資料。

---

## 2. 新品 `GET /api/products/new-arrivals`

### Request

| 參數 | 型別 | 必填 | 預設 | 說明 |
|---|---|---|---|---|
| `page` | number | ❌ | `0` | 第幾頁，**從 0 開始** |
| `size` | number | ❌ | `24` | 一頁幾筆 |
| `sort` | string | ❌ | `id,desc` | 排序，格式 `欄位,方向` |

範例：`GET /api/products/new-arrivals?page=0&size=24`

### Response — 成功 `200 OK`

格式跟「搜尋商品」一樣，每一筆的 `newArrival` 都是 `true`。

### Response — 失敗

這支沒有主動丟出的錯誤。

### 過程中做了什麼

```
前端 GET /api/products/new-arrivals
   │
   ▼
① ProductService.getNewArrivals()
   ├─ 查上架中、is_new 是 true 的商品，分頁排序
   └─ 每個 Product 轉成 ProductCardResponse
   │
   ▼
② 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`products`、`product_styles`、`styles` 表，不會寫入任何資料。

---

## 3. 商品詳細頁 `GET /api/products/{slug}`

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
  "styles": [
    { "id": 4, "code": "casual", "name": "休閒" },
    { "id": 5, "code": "sporty", "name": "運動風" }
  ],
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

（`variantId`、`styles` 是示意用的，實際值以資料庫為準；這裡只列一部分顏色和尺寸。）

商品本身：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `slug` | string | 商品字串 id |
| `name` | string | 商品名稱 |
| `description` | string \| null | 商品描述，可能是 `null` |
| `price` | number | 售價 |
| `origPrice` | number \| null | 原價；**有值且大於 `price` 時顯示特價** |
| `styles` | array | 商品的風格標籤，每一筆是 `{ id, code, name }`，順序不固定；沒有標籤是 `[]` |
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
- 尺寸：照 SKU id 由小到大。程式本身沒有特別排尺寸。

**登入的會員看商品會留下瀏覽紀錄：** 帶會員 token 呼叫時，後端會記錄這次瀏覽，給個人化推薦用。沒帶 token、帶無效 token 或員工 token 都不會記錄，商品資料一樣正常回傳。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | `slug` 找不到商品，**或商品已下架** | `找不到商品：{slug}`，例：`找不到商品：men-487511` |

### 過程中做了什麼

```
前端 GET /api/products/{slug}
   │
   ▼
① ProductService.getProductDetail()   ← 整段包在 @Transactional 裡
   ├─ 用 slug 查「上架中」的商品（findOnSaleBySlug）
   │    └─ 查不到或已下架 → 404「找不到商品：{slug}」
   ├─ 查這件商品的所有 SKU，照 id 由小到大
   ├─ MemberProductViewService.recordView()：會員才記錄瀏覽
   │    ├─ 不是會員 → 什麼都不做
   │    ├─ 上次瀏覽超過 30 分鐘 → view_count + 1、更新 last_viewed_at
   │    ├─ 30 分鐘內看過 → 什麼都不做
   │    └─ 第一次看這件商品 → 新增一筆，view_count = 1
   └─ ProductDetailResponse.from()：把 SKU 依顏色分組
        ├─ 同顏色的 SKU 放在一起
        ├─ 每個顏色的圖片取第一個 SKU 的圖片
        └─ 每個 SKU 轉成一個 SizeOption（variantId、size、stock）
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 讀 `products`、`product_variants`、`product_styles`、`styles` 表。帶會員 token 時，會新增或更新 `member_product_views` 的一筆。

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

藍色先出現，所以排在黑色前面。程式用 `LinkedHashMap` 保持「第一次放進去的順序」。
