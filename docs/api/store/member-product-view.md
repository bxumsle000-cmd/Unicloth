# Member Product View API（清除瀏覽紀錄）

- Controller：`controller/store/MemberProductViewController.java`
- Service：`service/shop/MemberProductViewService.java`
- 共同前綴：`/api/member/product-views`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 清除我的瀏覽紀錄 | DELETE | `/api/member/product-views` | 200 | `{ deletedCount }` |

**瀏覽紀錄是怎麼來的？** 登入的會員打開商品詳細頁（`GET /api/products/{slug}`）時，後端會自動記一筆，同一件商品 30 分鐘內重複瀏覽只算一次。個人化推薦（`GET /api/recommendations`）就是靠這份紀錄算的。

> 🔒 **需要登入**：請求要帶 `Authorization: Bearer <token>`（token 從 `/api/auth/firebase` 取得），操作的是 token 裡的那個會員。

---

## 1. 清除我的瀏覽紀錄 `DELETE /api/member/product-views`

### Request

不需要參數，也不需要 body。

### Response — 成功 `200 OK`

```json
{
  "deletedCount": 12
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `deletedCount` | number | 這次刪掉幾筆；本來就沒有紀錄時是 `0` |

> 紀錄是「每件商品一筆」，`deletedCount` 是商品數，不是瀏覽次數。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 沒帶 token、token 無效或過期 | `尚未登入或登入已失效` |
| 403 | 還沒補填會員資料 | `請先填寫會員資料` |
| 403 | 帶的是員工 token | `沒有權限使用這個功能` |

> 這支只用 token 裡的會員 id，沒有查會員狀態，所以被停用的會員在 token 過期前還是能清除自己的紀錄。

### 過程中做了什麼

```
前端 DELETE /api/member/product-views
   │
   ▼
① Controller：CurrentMember.getCurrentId() 取得目前登入的會員 id
   │
   ▼
② MemberProductViewService.clearHistory()   ← 包在 @Transactional 裡
   └─ 刪掉 member_product_views 裡這個會員的所有紀錄，回傳刪了幾筆
   │
   ▼
③ 回 200 + { deletedCount }
```

**資料庫影響：** `member_product_views` 表刪除這個會員的所有紀錄。
