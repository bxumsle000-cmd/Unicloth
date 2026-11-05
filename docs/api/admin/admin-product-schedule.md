# Admin Product Schedule API（商品部後台：預定下架）

- Controller：`controller/admin/AdminProductScheduleController.java`
- Service：`service/admin/AdminProductScheduleService.java`
- 共同前綴：`/api/admin/product/product-schedules`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 查詢預定下架時間 | GET | `/api/admin/product/product-schedules/{productId}` | 200 | `{ productId, scheduledOffAt }` |
| 設定 / 清除預定下架時間 | PATCH | `/api/admin/product/product-schedules/{productId}` | 200 | `{ productId, scheduledOffAt }` |

**時間到了會自動下架**：`ProductOffShelfScheduler` 每分鐘檢查一次，把時間到了的上架商品改成 `OFF_SHELF`，並清掉 `scheduled_off_at`。

> 🔒 **只有 PRODUCT、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
>
> 下面各支 API 的「失敗」表格就不再重複列這兩種。

---

## 1. 查詢預定下架時間 `GET /api/admin/product/product-schedules/{productId}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |

範例：`GET /api/admin/product/product-schedules/1809`

### Response — 成功 `200 OK`

```json
{
  "productId": 1809,
  "scheduledOffAt": "2026-12-01T00:00:00"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `productId` | number | 商品 id |
| `scheduledOffAt` | string \| null | 預定下架時間，格式 `yyyy-MM-ddTHH:mm:ss`；沒設定是 `null` |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到商品 | `找不到商品：{productId}` |

### 過程中做了什麼

```
前端 GET /api/admin/product/product-schedules/{productId}
   │
   ▼
① AdminProductScheduleService.getScheduledOffAt()   ← @Transactional(readOnly = true)
   └─ 用 id 查商品 → 查不到 → 404
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 只有「讀」`products` 表，不會寫入任何資料。

---

## 2. 設定 / 清除預定下架時間 `PATCH /api/admin/product/product-schedules/{productId}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `productId` | 路徑 | number | ✅ | 商品 id |

```json
{
  "scheduledOffAt": "2026-12-01T00:00:00"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `scheduledOffAt` | string \| null | ❌ | 格式 `yyyy-MM-ddTHH:mm:ss`，要晚於現在（訊息：`預定下架時間必須晚於現在`）；**傳 `null` 或不傳 = 清除** |

> 只有**上架中**的商品能設定時間；清除不限狀態。
> 手動把商品下架（`PATCH .../status`、`.../batch-status`）**不會**清掉這個時間，要清除請呼叫這支。

### Response — 成功 `200 OK`

格式同「查詢預定下架時間」。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 時間不晚於現在 | `scheduledOffAt: 預定下架時間必須晚於現在` |
| 400 | 時間格式不對 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 商品不是上架中，卻要設定時間 | `商品必須先上架，才能設定預定下架時間` |
| 404 | 找不到商品 | `找不到商品：{productId}` |

### 過程中做了什麼

```
前端 PATCH /api/admin/product/product-schedules/{productId}
   │
   ▼
① @Valid 檢查 UpdateProductScheduledOffAtRequest
   └─ 有值但不晚於現在 → 400
   │
   ▼
② AdminProductScheduleService.updateScheduledOffAt()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查商品 → 查不到 → 404
   ├─ 要設定時間，但商品不是 ON_SALE → 400
   └─ 把 scheduled_off_at 設成 Request 的值
   │
   ▼
③ 回 200 + JSON
```

**資料庫影響：** `products` 表更新一筆的 `scheduled_off_at`。
