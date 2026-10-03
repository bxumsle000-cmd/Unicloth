# Cart API（購物車）

- Controller：`controller/CartController.java`
- Service：`service/CartItemService.java`
- 共同前綴：`/api/cart`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 我的購物車 | GET | `/api/cart` | 200 | 購物車清單 |
| 加入購物車 | POST | `/api/cart` | 204 | 沒有 body |
| 修改數量 | PATCH | `/api/cart` | 204 | 沒有 body |
| 移除一筆 | DELETE | `/api/cart/{cartItemId}` | 204 | 沒有 body |

**購物車是以「SKU」為單位**：SKU 就是「某件商品的某個顏色 + 某個尺寸」，例如「圓領T恤 黑色 M」。同一件 T 恤的黑色 M 和黑色 L 是兩筆。

**兩種 id 不要搞混：**

| id | 是什麼 | 哪裡用 |
|---|---|---|
| `variantId` | SKU 的 id | 加入購物車時傳 |
| `cartItemId`（回應裡的 `id`） | 購物車裡「這一筆」的 id | 修改數量、移除時傳 |

> ⚠️ **目前是開發用的假登入**：這四支 API 都是操作「目前登入的會員」，而 `security/CurrentMember.java` **寫死會員 id = 1**，不會看前端帶的 token。

---

## 1. 我的購物車 `GET /api/cart`

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  {
    "id": 12,
    "slug": "men-487511",
    "imageUrl": "img/products/men-487511/col66.jpg",
    "name": "DRY-EX防曬連帽外套",
    "color": "藍色",
    "size": "M",
    "price": 390,
    "qty": 2,
    "stock": 14,
    "onSale": true
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 購物車這一筆的 id，**修改數量、移除時要傳回來** |
| `slug` | string | 商品字串 id，點進商品頁用 |
| `imageUrl` | string | 這個 SKU（顏色）的圖片 |
| `name` | string | 商品名稱 |
| `color` | string | 顏色，例：`藍色` |
| `size` | string | 尺寸，例：`M` |
| `price` | number | 單價（**現在的**售價，不是加入購物車當時的價格） |
| `qty` | number | 數量 |
| `stock` | number | 這個 SKU **現在的**庫存；前端可以用來限制數量上限、顯示庫存不足 |
| `onSale` | boolean | 商品是否上架中；`false` 時前端應顯示「已下架」、不能結帳 |

> 順序是**先加入的在前面**。
> 已下架的商品**也會出現**，`onSale` 是 `false`。
> 小計要前端自己算：`price × qty`。
> 購物車是空的時候，回空陣列 `[]`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 GET /api/cart
   │
   ▼
① CartItemService.getCartItems()
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用目前登入的會員 id 查 cart_items，
   │    同時把 SKU 和商品一起撈出來（join fetch），照加入時間，舊的在前
   └─ 每一筆轉成 CartItemResponse
        ├─ imageUrl 取 SKU 的圖片
        ├─ price 取商品的售價
        └─ onSale = 商品狀態是不是 ON_SALE
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`cart_items`、`product_variants`、`products` 表，不會寫入任何資料。

---

## 2. 加入購物車 `POST /api/cart`

### Request

```json
{
  "variantId": 1001,
  "qty": 2
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `variantId` | number | ✅ | 不可為 `null`；要加入的 SKU id |
| `qty` | number | ✅ | 必須 > 0；這次要**加上去**的數量 |

> `qty` 沒傳時會被當成 `0`，所以一樣會因為「必須 > 0」回 400。

### Response — 成功 `204 No Content`

沒有 body。

> **同一個 SKU 會累加，不會多一筆**：購物車已經有「藍色 M × 2」，再加入「藍色 M × 1」，結果是「藍色 M × 3」。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`qty: 必須是正數` |
| 400 | 其他欄位格式錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |
| 404 | `variantId` 找不到 SKU | `沒有找到商品` |
| 409 | 商品已下架 | `商品已下架` |
| 409 | 購物車原本的數量 + 這次的數量 > 庫存 | `不能超過庫存數量` |

**庫存檢查的手動推演**（庫存 5）：

| 購物車原本 | 這次加入 | 加完總數 | 結果 |
|---|---|---|---|
| 0（沒有這筆） | 3 | 3 | ✅ 新增一筆，數量 3 |
| 3 | 2 | 5 | ✅ 數量變 5 |
| 3 | 3 | 6 | ❌ 409「不能超過庫存數量」，數量維持 3 |

### 過程中做了什麼

```
前端 POST /api/cart
   │
   ▼
① Spring 把 JSON 轉成 AddCartItemRequest
   └─ 轉不過去（JSON 語法錯）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400（一次列出所有錯的欄位）
   │
   ▼
③ CartItemService.add()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用 variantId 查 SKU
   │    └─ 查不到 → 404「沒有找到商品」
   ├─ 檢查 SKU 所屬的商品是不是 ON_SALE
   │    └─ 不是 → 409「商品已下架」
   ├─ 查購物車裡有沒有同一個 SKU，算出「原本數量」（沒有就是 0）
   ├─ 檢查 原本數量 + qty 是否超過庫存
   │    └─ 超過 → 409「不能超過庫存數量」
   ├─ 購物車沒有這個 SKU → 新增一筆（save）
   └─ 購物車已有這個 SKU → 數量加上 qty
   │
   ▼
④ 交易結束，Hibernate 自動把改過的數量 UPDATE 回資料庫（dirty checking）
   │
   ▼
⑤ 回 204（沒有 body）
```

**資料庫影響：** `cart_items` 表新增一筆，或更新既有那一筆的 `qty`。**不會扣庫存**，庫存是結帳時才扣。

新增時：

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `member_id` | 目前登入的會員 |
| `variant_id` | Request 的 `variantId` |
| `qty` | Request 的 `qty` |
| `created_at` | 寫入當下的時間 |

**補充：為什麼同一個 SKU 只會有一筆？**
資料庫有 `UNIQUE(member_id, variant_id)`，同一個會員同一個 SKU 只能有一列，所以程式要先查有沒有，有的話改數量，沒有才新增。

---

## 3. 修改數量 `PATCH /api/cart`

購物車頁面上改數量。

### Request

```json
{
  "cartItemId": 12,
  "qty": 3
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `cartItemId` | number | ✅ | 必須 > 0；購物車這一筆的 id（「我的購物車」回應裡的 `id`） |
| `qty` | number | ✅ | 必須 > 0；**改成**的數量 |

> **是「直接設定」不是「加減」**：原本 2，傳 `qty: 3`，結果是 3（不是 5）。
> 想把數量改成 0？不行，會回 400。要移除請用「移除一筆」。
> `cartItemId`、`qty` 沒傳時會被當成 `0`，一樣會回 400。

### Response — 成功 `204 No Content`

沒有 body。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`qty: 必須是正數` |
| 400 | 其他欄位格式錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |
| 404 | `cartItemId` 不存在，**或不是自己的購物車** | `找不到購物車編號` |
| 409 | 新數量 > 庫存 | `不能超過庫存數量` |

### 過程中做了什麼

```
前端 PATCH /api/cart
   │
   ▼
① Spring 把 JSON 轉成 ChangeCartItemQtyRequest
   └─ 轉不過去（JSON 語法錯）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400（一次列出所有錯的欄位）
   │
   ▼
③ CartItemService.changeQty()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用 cartItemId + 目前會員 查購物車那一筆
   │    └─ 查不到（不存在或是別人的）→ 404「找不到購物車編號」
   ├─ 檢查 qty 是否超過 SKU 的庫存
   │    └─ 超過 → 409「不能超過庫存數量」
   └─ 把數量設成 qty
   │
   ▼
④ 交易結束，Hibernate 自動 UPDATE 回資料庫（dirty checking）
   │
   ▼
⑤ 回 204（沒有 body）
```

**資料庫影響：** `cart_items` 表更新一筆的 `qty`，其他欄位不變。

> 為什麼查詢時要加「目前會員」？這樣別人就算猜到你的 `cartItemId`，也改不到你的購物車，只會拿到 404。

> ⚠️ 觀察到的小地方（不影響目前功能，供參考）：「加入購物車」會檢查商品是否下架，「修改數量」**沒有**檢查。所以已下架商品在購物車裡仍然可以改數量；結帳時 `CheckoutService` 會擋下，回 409「「商品名稱」已下架，請先從購物車移除」。

---

## 4. 移除一筆 `DELETE /api/cart/{cartItemId}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `cartItemId` | 路徑 | number | ✅ | 購物車這一筆的 id |

範例：`DELETE /api/cart/12`

### Response — 成功 `204 No Content`

沒有 body。

> **編號不存在也不會報錯**：`cartItemId` 不存在、或是別人的，一樣回 204，但什麼都不會刪。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

> `cartItemId` 不是數字（例如 `/api/cart/abc`）時，我**推測**會回 500 `系統發生錯誤，請稍後再試`：Spring 轉型失敗丟出的例外，`GlobalExceptionHandler` 沒有專門處理，會掉到最後的兜底 handler。沒有實際測過。

### 過程中做了什麼

```
前端 DELETE /api/cart/{cartItemId}
   │
   ▼
① CartItemService.remove()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   └─ 刪掉 cart_items 裡「這個 id + 目前會員」那一筆
        沒有符合的就什麼都不做
   │
   ▼
② 回 204（沒有 body）
```

**資料庫影響：** `cart_items` 表刪除一筆（沒有符合的就不刪）。
