# Admin Product Category API（商品部後台：分類）

- Controller：`controller/admin/AdminProductCategoryController.java`
- Service：`service/admin/AdminProductService.java`、`service/admin/AdminCategoryService.java`
- 共同前綴：`/api/admin/product/categories`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 可選的最底層分類 | GET | `/api/admin/product/categories` | 200 | 分類選項清單 |
| 完整分類樹 | GET | `/api/admin/product/categories/tree` | 200 | 分類樹 |
| 新增子分類 | POST | `/api/admin/product/categories` | 201 | 剛建立的分類 |

> 🔒 **只有 PRODUCT、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
>
> 下面各支 API 的「失敗」表格就不再重複列這兩種。

---

## 1. 可選的最底層分類 `GET /api/admin/product/categories`

新增、編輯商品時的分類下拉選單。商品只能掛在最底層分類。

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  {
    "id": 343,
    "code": "all_women-tops-sweat-collection-anchor01",
    "name": "休閒上衣",
    "path": "女裝／T恤/背心/休閒／SWEAT 休閒帽T．大學T／休閒上衣"
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 分類 id；新增、編輯商品時傳 `categoryId` |
| `code` | string | 分類代碼 |
| `name` | string | 分類名稱 |
| `path` | string | 從第 1 層到自己的完整路徑，用 `／` 隔開 |

> 順序是依 `path` 排序。

### Response — 失敗

只有最上面列的共通錯誤。

### 過程中做了什麼

```
前端 GET /api/admin/product/categories
   │
   ▼
① AdminProductService.getCategoryOptions()   ← @Transactional(readOnly = true)
   ├─ 查出所有分類
   ├─ 找出「有子分類」的 id，去掉這些，留下最底層
   ├─ 每個分類往上爬，組出 path
   └─ 依 path 排序
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`categories` 表，不會寫入任何資料。

---

## 2. 完整分類樹 `GET /api/admin/product/categories/tree`

分類管理頁用，包含每個分類有幾件商品。

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  {
    "id": 230,
    "name": "男裝",
    "code": "all_men",
    "iconUrl": null,
    "directProductCount": 0,
    "totalProductCount": 384,
    "children": [
      {
        "id": 231,
        "name": "外套類",
        "code": "all_men-outer",
        "iconUrl": "img/categories/icon-all_men-outer.jpg",
        "directProductCount": 0,
        "totalProductCount": 56,
        "children": []
      }
    ]
  }
]
```

（`children` 只列出部分。）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 分類 id；新增子分類時傳 `parentId` |
| `name` | string | 分類名稱 |
| `code` | string | 分類代碼 |
| `iconUrl` | string \| null | 分類小圖示 |
| `directProductCount` | number | **直接**掛在這個分類的商品數 |
| `totalProductCount` | number | 這個分類 + 所有子孫分類的商品總數 |
| `children` | array | 子分類，欄位一樣，不管幾層都會帶；最底層是 `[]` |

> 同一層照 id 由小到大。
> 商品數包含已下架的商品。

**`totalProductCount` 的手動推演：**

| 分類 | 直接掛的商品 | 子分類的 total | `totalProductCount` |
|---|---|---|---|
| 連帽外套（最底層） | 8 | 無 | 8 |
| 夾克（最底層） | 16 | 無 | 16 |
| 連帽/布勞森外套 | 0 | 8 + 16 | 24 |

### Response — 失敗

只有最上面列的共通錯誤。

### 過程中做了什麼

```
前端 GET /api/admin/product/categories/tree
   │
   ▼
① AdminCategoryService.getCategoryTree()   ← @Transactional(readOnly = true)
   ├─ 查出所有分類
   ├─ 查出所有商品，算出每個分類直接掛幾件
   ├─ 把分類依 parent id 分組
   └─ 從第 1 層開始遞迴往下組節點，把子分類的 total 加上來
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`categories`、`products` 表，不會寫入任何資料。

---

## 3. 新增子分類 `POST /api/admin/product/categories`

在指定分類底下新增一個子分類。**不能新增第 1 層**（`parentId` 必填）。

### Request

```json
{
  "parentId": 231,
  "name": "風衣",
  "code": "all_men-outer-trench"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `parentId` | number | ✅ | 不可空（訊息：`請選擇上層分類`）；上層分類的 id |
| `name` | string | ✅ | 不可空白（訊息：`請輸入分類名稱`）；最多 50 字（訊息：`分類名稱最多 50 個字`）；同一個上層底下不能重複 |
| `code` | string | ✅ | 不可空白（訊息：`請輸入分類代碼`）；最多 100 字（訊息：`分類代碼最多 100 個字`）；只能用小寫英文、數字、底線、連字號（訊息：`分類代碼只能使用小寫英文、數字、底線和連字號`）；全站不能重複 |

> ⚠️ 後端沒有檢查上層分類是不是已經掛了商品。在有商品的最底層分類底下新增子分類後，它就不再是最底層，原本的商品還是直接掛在它身上。

### Response — 成功 `201 Created`

```json
{
  "id": 500,
  "name": "風衣",
  "code": "all_men-outer-trench",
  "iconUrl": null,
  "directProductCount": 0,
  "totalProductCount": 0,
  "children": []
}
```

欄位同「完整分類樹」。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`code: 分類代碼只能使用小寫英文、數字、底線和連字號` |
| 404 | 找不到上層分類 | `找不到上層分類：{parentId}` |
| 409 | 分類代碼已存在 | `分類代碼已存在：{code}` |
| 409 | 同一個上層底下已經有這個名稱 | `「{上層名稱}」底下已經有「{name}」分類`，例：`「男裝」底下已經有「外套類」分類` |

### 過程中做了什麼

```
前端 POST /api/admin/product/categories
   │
   ▼
① @Valid 檢查 CreateAdminCategoryRequest
   └─ 沒過 → 400
   │
   ▼
② AdminCategoryService.createCategory()   ← 整段包在 @Transactional 裡
   ├─ 用 parentId 查上層分類 → 查不到 → 404
   ├─ name 去掉前後空白；code 去掉前後空白、轉小寫
   ├─ code 已存在 → 409
   ├─ 同一個上層底下 name 已存在 → 409
   └─ 存一筆 Category
   │
   ▼
③ 回 201 + 剛建立的分類
```

**資料庫影響：** `categories` 表新增一筆。

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `parent_id` | Request 的 `parentId` |
| `name`、`code` | Request（整理過） |
| `icon_url` | `null` |
