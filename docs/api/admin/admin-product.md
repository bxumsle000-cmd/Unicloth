# Admin Product API（商品部後台：商品管理）

- Controller：`controller/admin/AdminProductController.java`
- Service：`service/admin/AdminProductService.java`、`AdminProductBatchService.java`、`AdminProductImageService.java`、`AdminProductVariantService.java`、`AdminProductStockService.java`
- 共同前綴：`/api/admin/product/products`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 商品列表 | GET | `/api/admin/product/products` | 200 | 商品摘要（分頁） |
| 新增商品 | POST | `/api/admin/product/products` | 201 | 完整商品 |
| 批次改狀態 | PATCH | `/api/admin/product/products/batch-status` | 204 | 沒有 body |
| 批次改分類 | PATCH | `/api/admin/product/products/batch-category` | 204 | 沒有 body |
| 商品詳細資料 | GET | `/api/admin/product/products/{productId}` | 200 | 完整商品 |
| 編輯商品 | PUT | `/api/admin/product/products/{productId}` | 200 | 完整商品 |
| 上傳商品圖片 | POST | `/api/admin/product/products/{productId}/images` | 201 | `{ imageUrl }` |
| 新增 SKU | POST | `/api/admin/product/products/{productId}/variants` | 201 | 完整商品 |
| 刪除 SKU | DELETE | `/api/admin/product/products/{productId}/variants/{variantId}` | 204 | 沒有 body |
| 修改庫存 | PATCH | `/api/admin/product/products/{productId}/stock` | 200 | 完整商品 |
| 上架 / 下架 | PATCH | `/api/admin/product/products/{productId}/status` | 204 | 沒有 body |

**新增一件商品的順序：**

```
① POST /products                     建立商品（已下架、沒有 SKU）
② POST /products/{id}/images         上傳某個顏色的圖片，拿到 imageUrl
③ POST /products/{id}/variants       用 imageUrl 建立這個顏色的各尺寸 SKU
   （有幾個顏色就重複 ②③）
④ PATCH /products/{id}/status        上架（總庫存要 > 0）
```

**商品狀態 `status`：** `ON_SALE`（上架中）、`OFF_SHELF`（已下架）。

**上架、價格都在商品層**：SKU 沒有自己的狀態和價格。

> 🔒 **只有 PRODUCT、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
>
> 下面各支 API 的「失敗」表格就不再重複列這兩種。

---

## 1. 商品列表 `GET /api/admin/product/products`

### Request

全部都是選填，沒帶就是不篩。

| 參數 | 位置 | 型別 | 說明 |
|---|---|---|---|
| `keyword` | 網址 | string | 商品名稱或 slug「包含」這段文字就算，不分大小寫；前後空白會去掉 |
| `status` | 網址 | string | `ON_SALE` / `OFF_SHELF` |
| `page` | 網址 | number | 第幾頁，**從 0 開始**；預設 `0` |
| `size` | 網址 | number | 一頁幾筆；預設 `20` |
| `sort` | 網址 | string | 排序；預設 `id,desc`（新的在前面） |

範例：`GET /api/admin/product/products?keyword=外套&status=ON_SALE&page=0&size=20`

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "id": 1809,
      "slug": "kids-481291",
      "name": "HEATTECH針織手套",
      "categoryName": "手套",
      "categoryCode": "all_kids-accesories-gloves",
      "price": 190,
      "totalStock": 48,
      "status": "ON_SALE",
      "imageUrl": "img/products/kids-481291/col16.jpg"
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 916,
    "totalPages": 46
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 商品 id；其他 API 用它指定商品 |
| `slug` | string | 商品字串 id |
| `name` | string | 商品名稱 |
| `categoryName`、`categoryCode` | string | 所屬分類的名稱、代碼 |
| `price` | number | 售價 |
| `totalStock` | number | 所有 SKU 的庫存加總 |
| `status` | string | `ON_SALE` / `OFF_SHELF` |
| `imageUrl` | string \| null | 商品主圖；還沒建 SKU 是 `null` |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 500 | `status` 不是上面列的值、`sort` 用了不存在的欄位 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/product/products?...
   │
   ▼
① AdminProductService.getProducts()   ← @Transactional(readOnly = true)
   ├─ keyword 去掉前後空白
   ├─ 依條件查 products，分頁排序
   ├─ 用這一頁的商品 id 一次查出全部 SKU，算出每件商品的總庫存
   └─ 組成 AdminProductListResponse
   │
   ▼
② 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`products`、`product_variants`、`categories` 表，不會寫入任何資料。

---

## 2. 新增商品 `POST /api/admin/product/products`

### Request

```json
{
  "productNumber": "491234",
  "name": "柔軟舒適圓領T恤",
  "description": "輕薄透氣的棉質T恤。",
  "price": 390,
  "origPrice": 590,
  "categoryId": 339,
  "styleIds": [1, 3],
  "newArrival": true,
  "hot": false
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `productNumber` | string | ✅ | 不可空白（訊息：`請輸入商品貨號`）；6 位數字（訊息：`商品貨號必須是 6 位數字`）；不能重複 |
| `name` | string | ✅ | 不可空白（訊息：`請輸入商品名稱`）；最多 200 字（訊息：`商品名稱不能超過 200 個字`）；前後空白會去掉 |
| `description` | string | ❌ | 商品說明；空白會存成 `null` |
| `price` | number | ✅ | 不可空（訊息：`請輸入售價`）；> 0（訊息：`售價必須大於 0`） |
| `origPrice` | number | ❌ | 原價；> 0（訊息：`原價必須大於 0`）；有傳的話要**大於**售價 |
| `categoryId` | number | ✅ | 不可空（訊息：`請選擇商品分類`）；要是**最底層**分類（見 [admin-product-category.md](admin-product-category.md)） |
| `styleIds` | number[] | ❌ | 風格標籤 id（見 [style.md](../store/style.md)） |
| `newArrival` | boolean | ✅ | 是否顯示新品標籤；**一定要傳**，沒傳回 400 |
| `hot` | boolean | ✅ | 是否顯示熱門標籤；**一定要傳**，沒傳回 400 |

**`slug` 怎麼產生：** 依分類的第 1 層決定前綴，加上貨號。

| 第 1 層分類代碼 | 前綴 | 例子 |
|---|---|---|
| `all_women` 開頭 | `women` | `women-491234` |
| `all_men` 開頭 | `men` | `men-491234` |
| `all_kids` 開頭 | `kids` | `kids-491234` |

> 新商品的狀態是 `OFF_SHELF`，因為還沒有 SKU 和庫存。

### Response — 成功 `201 Created`

```json
{
  "id": 1900,
  "slug": "women-491234",
  "name": "柔軟舒適圓領T恤",
  "description": "輕薄透氣的棉質T恤。",
  "price": 390,
  "origPrice": 590,
  "categoryId": 339,
  "categoryName": "長袖",
  "categoryCode": "all_women-tops-t-shirts-anchor01",
  "newArrival": true,
  "hot": false,
  "status": "OFF_SHELF",
  "scheduledOffAt": null,
  "imageUrl": null,
  "styles": [
    { "id": 1, "code": "japanese", "name": "日系" },
    { "id": 3, "code": "minimal", "name": "簡約" }
  ],
  "variants": []
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id`、`slug`、`name` | | 商品 id、字串 id、名稱 |
| `description` | string \| null | 商品說明 |
| `price`、`origPrice` | number | 售價；原價（沒有是 `null`） |
| `categoryId`、`categoryName`、`categoryCode` | | 所屬分類 |
| `newArrival`、`hot` | boolean | 新品、熱門標籤 |
| `status` | string | `ON_SALE` / `OFF_SHELF` |
| `scheduledOffAt` | string \| null | 預定下架時間（見 [admin-product-schedule.md](admin-product-schedule.md)） |
| `imageUrl` | string \| null | 商品主圖 |
| `styles` | array | 風格標籤 `{ id, code, name }`，照 id 由小到大 |
| `variants` | array | SKU，見下表 |

`variants` 每一筆（照 id 由小到大）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | SKU id |
| `color` | string | 顏色 |
| `size` | string | 尺寸 |
| `skuCode` | string | SKU 代碼，例：`481291-COL16-S/M` |
| `stock` | number | 庫存 |
| `imageUrl` | string | 這個 SKU 的圖片 |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`productNumber: 商品貨號必須是 6 位數字`、`categoryId: 請選擇商品分類; price: 售價必須大於 0` |
| 400 | `newArrival`、`hot` 沒傳、JSON 語法錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 分類不是最底層 | `請選擇最下層商品分類` |
| 400 | 原價沒有大於售價 | `原價必須大於售價` |
| 400 | 分類的第 1 層不是女裝、男裝、童裝 | `無法判斷商品分類的網址前綴` |
| 400 | `styleIds` 有不存在的風格 | `包含不存在的風格標籤` |
| 404 | 找不到分類 | `找不到商品分類：{categoryId}` |
| 409 | 貨號已經用過 | `商品貨號已存在：{productNumber}` |

### 過程中做了什麼

```
前端 POST /api/admin/product/products
   │
   ▼
① Spring 把 JSON 轉成 CreateProductRequest，@Valid 檢查欄位
   └─ 沒過 → 400
   │
   ▼
② AdminProductService.createProduct()   ← 整段包在 @Transactional 裡
   ├─ 查分類 → 查不到 → 404；不是最底層 → 400
   ├─ 檢查原價 > 售價 → 沒過 → 400
   ├─ 檢查有沒有 slug 以「-貨號」結尾的商品 → 有 → 409
   ├─ 依分類第 1 層決定 slug 前綴
   ├─ 組商品（status = OFF_SHELF、image_url = null）
   ├─ ProductStyleService.applyStyles()：設定風格標籤 → 有不存在的 → 400
   └─ 存進資料庫
   │
   ▼
③ 回 201 + 完整商品
```

**資料庫影響：** `products` 表新增一筆；有傳 `styleIds` 時 `product_styles` 表每個風格新增一筆。

---

## 3. 批次改狀態 `PATCH /api/admin/product/products/batch-status`

**全部成功或全部不改**。

### Request

```json
{
  "productIds": [1809, 1800],
  "status": "OFF_SHELF"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `productIds` | number[] | ✅ | 至少一個（訊息：`請至少選擇一件商品`）；最多 100 個（訊息：`一次最多處理 100 件商品`）；不能有重複或 `null` |
| `status` | string | ✅ | 不可空（訊息：`請選擇商品狀態`）；`ON_SALE` / `OFF_SHELF` |

### Response — 成功 `204 No Content`

沒有 body。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`productIds: 請至少選擇一件商品; status: 請選擇商品狀態`、`productIds[0]: 商品 ID 不能是空值` |
| 400 | `status` 不是上面列的值 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | `productIds` 有重複 | `選取的商品中有重複項目` |
| 400 | 要上架，但有商品沒有庫存 | `以下商品沒有庫存，不能上架：{商品名稱}、{商品名稱}` |
| 404 | 有商品不存在 | `找不到商品：{id}`，多個用 `、` 隔開 |

### 過程中做了什麼

```
前端 PATCH /api/admin/product/products/batch-status
   │
   ▼
① @Valid 檢查 BatchUpdateProductStatusRequest
   └─ 沒過 → 400
   │
   ▼
② AdminProductBatchService.updateStatuses()   ← 整段包在 @Transactional 裡
   ├─ 有重複的 id → 400
   ├─ 查出這些商品 → 有不存在的 → 404
   ├─ 要上架 → 算每件商品的總庫存，有 ≤ 0 的 → 400（列出商品名稱）
   └─ 每件商品設定 status
   │
   ▼
③ 回 204（沒有 body）
```

**資料庫影響：** `products` 表更新這些商品的 `status`。

---

## 4. 批次改分類 `PATCH /api/admin/product/products/batch-category`

**全部成功或全部不改**。

### Request

```json
{
  "productIds": [1809, 1800],
  "categoryId": 339
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `productIds` | number[] | ✅ | 同「批次改狀態」 |
| `categoryId` | number | ✅ | 不可空（訊息：`請選擇分類`）；要是最底層分類 |

### Response — 成功 `204 No Content`

沒有 body。

> `slug` 不會跟著分類改變。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`categoryId: 請選擇分類; productIds: 請至少選擇一件商品` |
| 400 | `productIds` 有重複 | `選取的商品中有重複項目` |
| 400 | 分類不是最底層 | `只能移動到最底層分類：{分類名稱}` |
| 404 | 有商品不存在 | `找不到商品：{id}`，多個用 `、` 隔開 |
| 404 | 找不到分類 | `找不到分類：{categoryId}` |

### 過程中做了什麼

```
前端 PATCH /api/admin/product/products/batch-category
   │
   ▼
① @Valid 檢查 BatchUpdateProductCategoryRequest
   └─ 沒過 → 400
   │
   ▼
② AdminProductBatchService.updateCategories()   ← 整段包在 @Transactional 裡
   ├─ 有重複的 id → 400
   ├─ 查出這些商品 → 有不存在的 → 404
   ├─ 查分類 → 查不到 → 404；不是最底層 → 400
   └─ 每件商品設定分類
   │
   ▼
③ 回 204（沒有 body）
```

**資料庫影響：** `products` 表更新這些商品的 `category_id`。

---

## 5. 商品詳細資料 `GET /api/admin/product/products/{productId}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |

範例：`GET /api/admin/product/products/1809`

### Response — 成功 `200 OK`

格式同「新增商品」的回應。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到商品 | `找不到商品：{productId}` |
| 500 | `productId` 不是數字 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/product/products/{productId}
   │
   ▼
① AdminProductService.getProduct()   ← @Transactional(readOnly = true)
   ├─ 用 id 查商品 → 查不到 → 404
   ├─ 查這件商品的所有 SKU，照 id 由小到大
   └─ 組成 AdminProductDetailResponse
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 只有「讀」`products`、`product_variants`、`categories`、`product_styles`、`styles` 表，不會寫入任何資料。

---

## 6. 編輯商品 `PUT /api/admin/product/products/{productId}`

貨號（`slug`）、狀態不能在這裡改。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |

```json
{
  "name": "柔軟舒適圓領T恤",
  "description": "輕薄透氣的棉質T恤。",
  "price": 290,
  "origPrice": 590,
  "categoryId": 339,
  "styleIds": [1, 3],
  "newArrival": false,
  "hot": true
}
```

欄位規則同「新增商品」（沒有 `productNumber`）。這支是 PUT，**沒傳的 `description`、`origPrice` 會被清成 `null`**。

`styleIds` 比較特別：

| 傳什麼 | 結果 |
|---|---|
| 沒傳或 `null` | 保留原本的風格標籤 |
| `[]` | 清除全部風格標籤 |
| `[1, 3]` | 換成這些風格標籤 |

### Response — 成功 `200 OK`

更新後的完整商品，格式同「新增商品」的回應。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`name: 請輸入商品名稱; price: 售價必須大於 0` |
| 400 | `newArrival`、`hot` 沒傳、JSON 語法錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 分類不是最底層 | `請選擇最下層商品分類` |
| 400 | 原價沒有大於售價 | `原價必須大於售價` |
| 400 | `styleIds` 有不存在的風格 | `包含不存在的風格標籤` |
| 404 | 找不到商品 | `找不到商品：{productId}` |
| 404 | 找不到分類 | `找不到商品分類：{categoryId}` |

### 過程中做了什麼

```
前端 PUT /api/admin/product/products/{productId}
   │
   ▼
① Spring 把 JSON 轉成 UpdateProductRequest，@Valid 檢查欄位
   └─ 沒過 → 400
   │
   ▼
② AdminProductService.updateProduct()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查商品 → 查不到 → 404
   ├─ 查分類 → 查不到 → 404；不是最底層 → 400
   ├─ 檢查原價 > 售價 → 沒過 → 400
   ├─ 把欄位設成 Request 的值
   └─ ProductStyleService.applyStyles()：更新風格標籤 → 有不存在的 → 400
   │
   ▼
③ 回 200 + 完整商品
```

**資料庫影響：** `products` 表更新一筆；`product_styles` 依 `styleIds` 更新。

---

## 7. 上傳商品圖片 `POST /api/admin/product/products/{productId}/images`

### Request

`Content-Type` 要是 `multipart/form-data`。

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |
| `colorCode` | 表單 | string | ✅ | 顏色代碼，格式 `COL09`（`COL` + 2 位數字，不分大小寫） |
| `image` | 表單 | 檔案 | ✅ | 圖片：JPG、PNG 或 WEBP，**不能超過 5MB** |

### Response — 成功 `201 Created`

```json
{
  "imageUrl": "/img/products/kids-481291/col09-a1b2c3d4.jpg"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `imageUrl` | string | 圖片網址；**接著呼叫「新增 SKU」時傳這個值** |

> 這支只存檔案，**還不會寫進資料庫**，要等「新增 SKU」才會用到。
> 檔名是 `顏色代碼小寫-8 碼亂數.副檔名`，所以同一個顏色重複上傳不會覆蓋舊的。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 檔案是空的（0 byte） | `請選擇要上傳的商品圖片` |
| 400 | `colorCode` 格式不對 | `顏色代碼格式必須像 COL09` |
| 400 | 無法判斷檔案類型 | `無法判斷圖片格式` |
| 400 | 不是 JPG、PNG、WEBP | `圖片只支援 JPG、PNG 或 WEBP` |
| 404 | 找不到商品 | `找不到商品：{productId}` |
| 500 | 沒帶 `image`、`colorCode`；檔案超過 5MB；`Content-Type` 不是 multipart | `系統發生錯誤，請稍後再試` |
| 500 | 寫入硬碟失敗 | `商品圖片儲存失敗` |

### 過程中做了什麼

```
前端 POST /api/admin/product/products/{productId}/images
   │
   ▼
① Spring 解析 multipart（單檔上限 5MB、整個請求上限 6MB）
   └─ 超過 → 500
   │
   ▼
② AdminProductImageService.saveProductImage()
   ├─ 用 id 查商品 → 查不到 → 404
   ├─ 檔案是空的 → 400
   ├─ 檢查顏色代碼格式 → 不對 → 400
   ├─ 依檔案類型決定副檔名 → 不支援 → 400
   └─ 存到 src/main/resources/static/img/products/{slug}/
   │
   ▼
③ 回 201 + { imageUrl }
```

**資料庫影響：** 不會寫入資料庫，只會在 `src/main/resources/static/img/products/{slug}/` 新增一個檔案。

---

## 8. 新增 SKU `POST /api/admin/product/products/{productId}/variants`

一次建立**一個顏色**的多個尺寸。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |

```json
{
  "color": "黑色",
  "colorCode": "COL09",
  "imageUrl": "/img/products/kids-481291/col09-a1b2c3d4.jpg",
  "variants": [
    { "size": "S", "stock": 10 },
    { "size": "M", "stock": 20 }
  ]
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `color` | string | ✅ | 不可空白（訊息：`請輸入顏色名稱`）；最多 50 字（訊息：`顏色名稱不能超過 50 個字`） |
| `colorCode` | string | ✅ | 不可空白（訊息：`請輸入顏色代碼`）；格式 `COL09`（訊息：`顏色代碼格式必須像 COL09`）；存的時候轉大寫 |
| `imageUrl` | string | ✅ | 不可空白（訊息：`請提供商品圖片`）；「上傳商品圖片」回傳的值 |
| `variants` | array | ✅ | 至少一個（訊息：`請至少新增一個尺寸`） |
| `variants[].size` | string | ✅ | 不可空白（訊息：`請輸入尺寸`）；最多 20 字（訊息：`尺寸不能超過 20 個字`）；存的時候轉大寫，連續空白變一個 |
| `variants[].stock` | number | ✅ | 不可空（訊息：`請輸入庫存數量`）；≥ 0（訊息：`庫存不能小於 0`） |

**SKU 代碼怎麼產生：** `貨號-顏色代碼-尺寸`，尺寸的空白換成 `-`。例：貨號 `481291`、`COL09`、`S/M` → `481291-COL09-S/M`。

> 商品還沒有主圖時，`imageUrl` 會變成商品主圖。
> 這裡設定的庫存**不會**留下庫存異動紀錄。

### Response — 成功 `201 Created`

更新後的完整商品（含全部 SKU），格式同「新增商品」的回應。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`colorCode: 顏色代碼格式必須像 COL09`、`variants[0].size: 請輸入尺寸; variants[0].stock: 庫存不能小於 0` |
| 400 | 同一次送了重複的尺寸（不分大小寫） | `尺寸重複：{size}`，例：`尺寸重複：M` |
| 404 | 找不到商品 | `找不到商品：{productId}` |
| 409 | 這個顏色 + 尺寸已經存在 | `{color}／{size} 已經存在`，例：`紅色／S/M 已經存在` |
| 409 | SKU 代碼已經存在 | `SKU 已經存在：{skuCode}` |

### 過程中做了什麼

```
前端 POST /api/admin/product/products/{productId}/variants
   │
   ▼
① @Valid 檢查 CreateProductVariantsRequest
   └─ 沒過 → 400
   │
   ▼
② AdminProductService.createVariants()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查商品 → 查不到 → 404
   ├─ 查這件商品現有的 SKU
   ├─ 每個尺寸：
   │    ├─ 這次送的有重複 → 400
   │    ├─ 顏色 + 尺寸已存在 → 409
   │    ├─ SKU 代碼已存在 → 409
   │    └─ 組一筆 ProductVariant
   ├─ 全部存進資料庫
   └─ 商品還沒有主圖 → 設成 imageUrl
   │
   ▼
③ 回 201 + 完整商品
```

**資料庫影響：** `product_variants` 表每個尺寸新增一筆；商品還沒有主圖時更新 `products.image_url`。

---

## 9. 刪除 SKU `DELETE /api/admin/product/products/{productId}/variants/{variantId}`

商品要**先下架**，而且這個 SKU 的庫存要是 **0**。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |
| `variantId` | 路徑 | number | ✅ | SKU id |

範例：`DELETE /api/admin/product/products/1809/variants/33684`

### Response — 成功 `204 No Content`

沒有 body。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 商品還沒下架 | `請先將商品下架，再刪除 SKU` |
| 400 | 這個 SKU 還有庫存 | `此 SKU 尚有 {數量} 件庫存，請先將庫存調整為 0` |
| 404 | 找不到商品 | `找不到商品：{productId}` |
| 404 | 這件商品沒有這個 SKU | `找不到這件商品的 SKU：{variantId}` |

### 過程中做了什麼

```
前端 DELETE /api/admin/product/products/{productId}/variants/{variantId}
   │
   ▼
① AdminProductVariantService.deleteVariant()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查商品 → 查不到 → 404
   ├─ 商品不是 OFF_SHELF → 400
   ├─ 在這件商品的 SKU 裡找 variantId → 找不到 → 404
   ├─ 庫存 > 0 → 400
   ├─ 刪除 SKU
   └─ 被刪的 SKU 用的是商品主圖，而且沒有其他 SKU 在用這張圖
        → 主圖換成剩下 SKU 的第一張圖（都沒有就是 null）
   │
   ▼
② 回 204（沒有 body）
```

**資料庫影響：**

| 表 | 動作 |
|---|---|
| `product_variants` | 刪除一筆 |
| `cart_items` | 購物車裡有這個 SKU 的會一起刪掉（資料庫 `ON DELETE CASCADE`） |
| `order_items`、`inventory_transaction_items` | `variant_id` 變成 `null`（資料庫 `ON DELETE SET NULL`），快照資料保留 |
| `products` | 可能更新 `image_url` |

---

## 10. 修改庫存 `PATCH /api/admin/product/products/{productId}/stock`

直接把 SKU 的庫存**設定成**指定數字，並留下 `ADJUSTMENT` 庫存異動紀錄（見 [admin-inventory.md](admin-inventory.md)）。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |

```json
{
  "variants": [
    { "variantId": 33684, "stock": 10 },
    { "variantId": 33685, "stock": 0 }
  ]
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `variants` | array | ✅ | 至少一筆（訊息：`請提供至少一筆商品規格`） |
| `variants[].variantId` | number | ✅ | SKU id（訊息：`缺少商品規格 ID`）；同一次不能重複；要屬於這件商品 |
| `variants[].stock` | number | ✅ | 不可空（訊息：`請輸入庫存數量`）；≥ 0（訊息：`庫存不能小於 0`）；**改成**的數量，不是加減 |

### Response — 成功 `200 OK`

更新後的完整商品，格式同「新增商品」的回應。

> 跟原本一樣的數字不會留下異動明細；全部都沒變時，不會建立異動紀錄。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`variants: 請提供至少一筆商品規格`、`variants[0].stock: 庫存不能小於 0` |
| 400 | 同一個 SKU 出現兩次 | `商品規格重複：{variantId}` |
| 400 | SKU 不屬於這件商品 | `商品規格不屬於這件商品：{variantId}` |
| 403 | 有變動，而且呼叫的員工帳號已被停用 | `此帳號已被停用` |
| 404 | 有 SKU 不存在 | `找不到商品規格：{id}`，多個用 `、` 隔開 |

### 過程中做了什麼

```
前端 PATCH /api/admin/product/products/{productId}/stock
   │
   ▼
① @Valid 檢查 UpdateProductStockRequest
   └─ 沒過 → 400
   │
   ▼
② AdminProductStockService.updateStock()   ← 整段包在 @Transactional 裡
   ├─ 檢查 variantId 有沒有重複 → 有 → 400
   ├─ 查出這些 SKU 並鎖定 → 筆數對不上 → 404
   ├─ 有 SKU 不屬於這件商品 → 400
   ├─ 每個 SKU：數字有變才改庫存、組一筆明細
   ├─ 全部都沒變 → 結束
   ├─ CurrentStaff.require()：查出目前的員工 → 被停用 → 403
   └─ 存一筆異動紀錄（type = ADJUSTMENT，備註「商品後台手動調整庫存」）和明細
   │
   ▼
③ AdminProductService.getProduct()：重新查出完整商品
   │
   ▼
④ 回 200 + 完整商品
```

**資料庫影響：**

| 表 | 動作 |
|---|---|
| `product_variants` | 有變動的 SKU 更新 `stock` |
| `inventory_transactions` | 有變動時新增一筆 |
| `inventory_transaction_items` | 每個有變動的 SKU 新增一筆 |

---

## 11. 上架 / 下架 `PATCH /api/admin/product/products/{productId}/status`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |

```json
{
  "status": "ON_SALE"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `status` | string | ✅ | 不可空（訊息：`請選擇商品狀態`）；`ON_SALE` / `OFF_SHELF` |

### Response — 成功 `204 No Content`

沒有 body。

> 本來就是這個狀態時，不做任何檢查，直接回 204。
> 下架**不會**清掉預定下架時間（見 [admin-product-schedule.md](admin-product-schedule.md)）。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `status` 沒傳 | `status: 請選擇商品狀態` |
| 400 | `status` 不是上面列的值 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 要上架，但總庫存 ≤ 0 | `商品沒有庫存，不能上架` |
| 404 | 找不到商品 | `找不到商品：{productId}` |

### 過程中做了什麼

```
前端 PATCH /api/admin/product/products/{productId}/status
   │
   ▼
① @Valid 檢查 UpdateProductStatusRequest
   └─ 沒過 → 400
   │
   ▼
② AdminProductService.updateStatus()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查商品 → 查不到 → 404
   ├─ 狀態沒變 → 結束
   ├─ 要上架 → 算總庫存，≤ 0 → 400
   └─ 設定 status
   │
   ▼
③ 回 204（沒有 body）
```

**資料庫影響：** `products` 表更新一筆的 `status`。
