# Admin Inventory API（商品部後台：進貨 / 庫存紀錄 / 庫存警示）

- Controller：`controller/admin/AdminInventoryController.java`
- Service：`service/admin/AdminInventoryService.java`、`service/admin/AdminLowStockService.java`
- 共同前綴：`/api/admin/product/inventory`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 進貨入庫 | POST | `/api/admin/product/inventory/receive` | 201 | 這次的庫存異動紀錄 |
| 庫存異動紀錄 | GET | `/api/admin/product/inventory/transactions` | 200 | 異動紀錄（分頁） |
| 庫存警示 | GET | `/api/admin/product/inventory/warnings` | 200 | 缺貨、快賣完的商品 |

**庫存異動的類型 `type`：**

| `type` | 意思 | 哪支 API 產生 |
|---|---|---|
| `RECEIVE` | 進貨入庫，庫存增加 | 本檔的「進貨入庫」 |
| `ADJUSTMENT` | 手動調整，庫存可能增加或減少 | `PATCH /api/admin/product/products/{productId}/stock`（見 [admin-product.md](admin-product.md)） |

> 🔒 **只有 PRODUCT、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
>
> 下面各支 API 的「失敗」表格就不再重複列這兩種。

---

## 1. 進貨入庫 `POST /api/admin/product/inventory/receive`

一次可以入庫多個 SKU，**全部成功或全部不寫入**。

### Request

```json
{
  "note": "廠商週期補貨",
  "items": [
    { "variantId": 28459, "quantity": 36 },
    { "variantId": 28489, "quantity": 36 }
  ]
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `note` | string | ❌ | 進貨單號或備註；最多 255 字（訊息：`備註不能超過 255 個字`）；空白會存成 `null` |
| `items` | array | ✅ | 至少一筆（訊息：`請至少加入一筆進貨商品`）；最多 200 筆（訊息：`一次最多處理 200 筆 SKU`） |
| `items[].variantId` | number | ✅ | SKU id（訊息：`缺少 SKU ID`）；同一次不能重複 |
| `items[].quantity` | number | ✅ | 不可空（訊息：`請輸入進貨數量`）；必須 > 0（訊息：`進貨數量必須大於 0`）；這次要**加上去**的數量 |

### Response — 成功 `201 Created`

```json
{
  "id": 64,
  "type": "RECEIVE",
  "note": "廠商週期補貨",
  "staffId": 2,
  "staffName": "商品部測試員",
  "createdAt": "2026-10-28T14:29:37",
  "items": [
    {
      "id": 526,
      "variantId": 28459,
      "skuCode": "479160-COL65-L",
      "productName": "喀什米爾圓領毛衣(長袖)",
      "color": "藍色",
      "size": "L",
      "quantityChange": 36,
      "stockBefore": 6,
      "stockAfter": 42
    }
  ]
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 異動紀錄 id |
| `type` | string | `RECEIVE` / `ADJUSTMENT` |
| `note` | string \| null | 備註 |
| `staffId`、`staffName` | | 操作的員工 |
| `createdAt` | string | 異動時間 |
| `items` | array | 這次異動了哪些 SKU，見下表 |

`items` 每一筆：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 明細 id |
| `variantId` | number \| null | SKU id；**SKU 被刪除後是 `null`** |
| `skuCode`、`productName`、`color`、`size` | string | 異動當時的 SKU 資料（快照） |
| `quantityChange` | number | 庫存變化，增加是正數、減少是負數 |
| `stockBefore` | number | 異動前的庫存 |
| `stockAfter` | number | 異動後的庫存 |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`items: 請至少加入一筆進貨商品`、`items[0].variantId: 缺少 SKU ID; items[0].quantity: 進貨數量必須大於 0` |
| 400 | 同一個 SKU 出現兩次 | `進貨清單中有重複的 SKU：{variantId}` |
| 400 | 入庫後超過 `int` 上限 | `{skuCode} 入庫後的庫存數量過大` |
| 403 | 呼叫的員工帳號已被停用 | `此帳號已被停用` |
| 404 | 有 SKU 不存在 | `找不到 SKU：{id}`，多個用 `、` 隔開 |

### 過程中做了什麼

```
前端 POST /api/admin/product/inventory/receive
   │
   ▼
① @Valid 檢查 ReceiveProductStockRequest
   └─ 沒過 → 400
   │
   ▼
② AdminInventoryService.receiveStock()   ← 整段包在 @Transactional 裡
   ├─ 檢查 variantId 有沒有重複 → 有 → 400
   ├─ 查出這些 SKU 並鎖定（避免同時改庫存互相覆蓋）
   │    └─ 筆數對不上 → 404「找不到 SKU：…」
   ├─ CurrentStaff.require()：查出目前的員工 → 被停用 → 403
   ├─ 存一筆異動紀錄（type = RECEIVE）
   └─ 每個 SKU：庫存加上 quantity，存一筆明細（記錄前後庫存）
   │
   ▼
③ 回 201 + 異動紀錄
```

**資料庫影響：**

| 表 | 動作 |
|---|---|
| `product_variants` | 每個 SKU 的 `stock` 加上 `quantity` |
| `inventory_transactions` | 新增一筆 |
| `inventory_transaction_items` | 每個 SKU 新增一筆 |

---

## 2. 庫存異動紀錄 `GET /api/admin/product/inventory/transactions`

進貨和手動調整的紀錄都在這裡。**結帳扣庫存、取消訂單加回庫存不會記在這裡。**

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `page` | 網址 | number | ❌ | 第幾頁，**從 0 開始**；預設 `0` |
| `size` | 網址 | number | ❌ | 一頁幾筆；預設 `20` |
| `sort` | 網址 | string | ❌ | 排序；預設 `createdAt,desc`（最新的在前面） |

範例：`GET /api/admin/product/inventory/transactions?page=0&size=20`

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "id": 64,
      "type": "RECEIVE",
      "note": "廠商週期補貨",
      "staffId": 2,
      "staffName": "商品部測試員",
      "createdAt": "2026-10-28T14:29:37",
      "items": []
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 64,
    "totalPages": 4
  }
}
```

`content` 每一筆的欄位同「進貨入庫」的回應，`items` 照明細 id 由小到大。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 500 | `sort` 用了不存在的欄位 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/product/inventory/transactions
   │
   ▼
① AdminInventoryService.getTransactions()   ← @Transactional(readOnly = true)
   ├─ 分頁查 inventory_transactions
   ├─ 用這一頁的 id 一次查出全部明細，依異動紀錄分組
   └─ 組成 InventoryTransactionResponse
   │
   ▼
② 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`inventory_transactions`、`inventory_transaction_items`、`staff` 表，不會寫入任何資料。

---

## 3. 庫存警示 `GET /api/admin/product/inventory/warnings`

只看**上架中**的商品。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `threshold` | 網址 | number | ❌ | 警示值，預設 `5`；庫存**小於或等於**這個數字就列入；不能是負數 |

範例：`GET /api/admin/product/inventory/warnings?threshold=10`

### Response — 成功 `200 OK`

```json
[
  {
    "productId": 1809,
    "slug": "kids-481291",
    "productName": "HEATTECH針織手套",
    "imageUrl": "img/products/kids-481291/col16.jpg",
    "outOfStockVariants": [
      { "variantId": 33684, "skuCode": "481291-COL09-S/M", "color": "黑色", "size": "S/M", "stock": 0 }
    ],
    "lowStockVariants": [
      { "variantId": 33685, "skuCode": "481291-COL58-S/M", "color": "深綠色", "size": "S/M", "stock": 2 }
    ]
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `productId` | number | 商品 id |
| `slug` | string | 商品字串 id |
| `productName` | string | 商品名稱 |
| `imageUrl` | string \| null | 商品主圖 |
| `outOfStockVariants` | array | 缺貨的 SKU：`stock = 0` |
| `lowStockVariants` | array | 快賣完的 SKU：`0 < stock ≤ threshold` |

SKU 每一筆：`variantId`、`skuCode`、`color`、`size`、`stock`。

> 商品照 id 由大到小；同一件商品的 SKU 照庫存少到多。
> 沒有符合的商品時，回空陣列 `[]`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `threshold` 是負數 | `庫存警示值不能小於 0` |
| 500 | `threshold` 不是數字 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/product/inventory/warnings?threshold=...
   │
   ▼
① AdminLowStockService.getWarnings()   ← @Transactional(readOnly = true)
   ├─ threshold 是負數 → 400
   ├─ 查上架中商品裡 stock ≤ threshold 的 SKU，商品一起撈（join fetch）
   ├─ 依商品分組（保留查詢的順序）
   └─ 每件商品把 SKU 分成缺貨、快賣完兩組
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`product_variants`、`products` 表，不會寫入任何資料。
