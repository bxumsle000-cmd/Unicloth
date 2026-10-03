# Wishlist API（追蹤清單 / 愛心）

- Controller：`controller/WishlistController.java`
- Service：`service/WishlistService.java`
- 共同前綴：`/api/wishlist`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 我的追蹤清單 | GET | `/api/wishlist` | 200 | 追蹤的商品清單 |
| 這件商品是否已追蹤 | GET | `/api/wishlist/{slug}` | 200 | `true` / `false` |
| 加入追蹤 | POST | `/api/wishlist/{slug}` | 204 | 沒有 body |
| 取消追蹤 | DELETE | `/api/wishlist/{slug}` | 204 | 沒有 body |

這四支都**不需要 body**，參數只有網址上的 `{slug}`。

**`{slug}` 是什麼？** 商品的字串 id，例如 `men-487511`，跟商品頁網址、商品卡片上的 `slug` 是同一個。

**追蹤的是「商品」不是 SKU**：同一件 T 恤不管哪個顏色、尺寸，都只算追蹤一次。

> ⚠️ **目前是開發用的假登入**：這四支 API 都是操作「目前登入的會員」，而 `security/CurrentMember.java` **寫死會員 id = 1**，不會看前端帶的 token。

---

## 1. 我的追蹤清單 `GET /api/wishlist`

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  {
    "slug": "men-487511",
    "name": "DRY-EX防曬連帽外套",
    "price": 390,
    "imageUrl": "img/products/men-487511/col66.jpg",
    "onSale": true
  },
  {
    "slug": "women-487396",
    "name": "防潑水連帽外套",
    "price": 790,
    "imageUrl": "img/products/women-487396/col57.jpg",
    "onSale": false
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `slug` | string | 商品字串 id，點進商品頁用 |
| `name` | string | 商品名稱 |
| `price` | number | 售價（**現在的**售價，不是加入追蹤當時的價格） |
| `imageUrl` | string \| null | 縮圖（商品主圖），沒有時是 `null` |
| `onSale` | boolean | 是否上架中 |

> 順序是**最新追蹤的在最前面**。
> 已下架的商品**也會出現**，`onSale` 是 `false`。前端應該顯示「已下架」、不要連到商品頁，但仍然要能取消追蹤。
> 沒有追蹤任何商品時，回空陣列 `[]`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 GET /api/wishlist
   │
   ▼
① WishlistService.getWishlist()
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用目前登入的會員 id 查 wishlist_items，同時把商品一起撈出來（join fetch）
   │    照加入追蹤的時間，新的在前
   └─ 每一筆轉成 WishlistItemResponse
        └─ onSale = 商品狀態是不是 ON_SALE
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`wishlist_items`、`products` 表，不會寫入任何資料。

**補充：為什麼要「把商品一起撈出來」？**
如果先查出 10 筆追蹤，再每筆各查一次商品，總共要查 1 + 10 = 11 次資料庫（這叫 N+1 問題）。用 `join fetch` 一次就全部拿到。

---

## 2. 這件商品是否已追蹤 `GET /api/wishlist/{slug}`

商品頁的愛心要不要亮。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `slug` | 路徑 | string | ✅ | 商品字串 id |

範例：`GET /api/wishlist/men-487511`

### Response — 成功 `200 OK`

body 就是一個布林值，**不是物件**：

```json
true
```

| 值 | 意思 |
|---|---|
| `true` | 已追蹤，愛心要亮 |
| `false` | 沒追蹤，愛心不亮 |

> `slug` 亂打、商品根本不存在時，也是回 `false`，不會回 404。
> 已下架但有追蹤的商品，回 `true`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 GET /api/wishlist/{slug}
   │
   ▼
① WishlistService.isInWishlist()
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   └─ 查 wishlist_items 裡有沒有「目前會員 + 這個 slug 的商品」這一筆
   │
   ▼
② 回 200 + true / false
```

**資料庫影響：** 只有「讀」`wishlist_items`、`products` 表，不會寫入任何資料。

---

## 3. 加入追蹤 `POST /api/wishlist/{slug}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `slug` | 路徑 | string | ✅ | 商品字串 id |

範例：`POST /api/wishlist/men-487511`

### Response — 成功 `204 No Content`

沒有 body。

> **重複追蹤不會報錯**：已經追蹤過的商品再呼叫一次，一樣回 204，資料庫不會多一筆。前端不用先檢查是否已追蹤。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |
| 404 | `slug` 找不到商品，**或商品已下架** | `找不到商品:{slug}`，例：`找不到商品:men-487511` |

> 已下架的商品不能**新增**追蹤，但原本就追蹤的下架商品會留在清單裡。

### 過程中做了什麼

```
前端 POST /api/wishlist/{slug}
   │
   ▼
① WishlistService.add()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用 slug 查「上架中」的商品（findOnSaleBySlug）
   │    └─ 查不到或已下架 → 404「找不到商品:{slug}」
   ├─ 檢查是否已經追蹤過
   │    └─ 已追蹤 → 直接結束（不存、不報錯）
   └─ 新增一筆 WishlistItem 存進資料庫
   │
   ▼
② 回 204（沒有 body）
```

**資料庫影響：** `wishlist_items` 表新增一筆（已追蹤過就不新增）。

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `member_id` | 目前登入的會員 |
| `product_id` | 用 `slug` 查到的商品 |
| `created_at` | 寫入當下的時間 |

**補充：為什麼要先檢查「是否已追蹤」？**
資料庫有 `UNIQUE(member_id, product_id)`，同一個會員同一件商品只能有一筆。不先檢查就直接存，重複時資料庫會擋下來，變成 500 錯誤。

---

## 4. 取消追蹤 `DELETE /api/wishlist/{slug}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `slug` | 路徑 | string | ✅ | 商品字串 id |

範例：`DELETE /api/wishlist/men-487511`

### Response — 成功 `204 No Content`

沒有 body。

> **本來就沒追蹤也不會報錯**：`slug` 不存在、或本來就沒追蹤，一樣回 204。
> 已下架的商品也刪得掉。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 DELETE /api/wishlist/{slug}
   │
   ▼
① WishlistService.remove()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   └─ 刪掉 wishlist_items 裡「目前會員 + 這個 slug 的商品」那一筆
        沒有符合的就什麼都不做
   │
   ▼
② 回 204（沒有 body）
```

**資料庫影響：** `wishlist_items` 表刪除一筆（沒有符合的就不刪）。
