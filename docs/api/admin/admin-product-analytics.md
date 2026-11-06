# Admin Product Analytics API（商品部後台：銷售趨勢）

- Controller：`controller/admin/AdminProductAnalyticsController.java`
- Service：`service/admin/ProductSalesAnalyticsService.java`
- 共同前綴：`/api/admin/product/analytics`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 銷售趨勢 | GET | `/api/admin/product/analytics/trends` | 200 | 商品趨勢清單 |

**參數：**

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `days` | 網址 | number | ❌ | 統計幾天，預設 `30`；小於 1 當成 1，大於 365 當成 365 |
| `limit` | 網址 | number | ❌ | 最多幾件商品，預設 `10`；小於 1 當成 1，大於 100 當成 100 |

**怎麼算：**

- 只算有效訂單：排除 `UNPAID`（未付款）、`CANCELLED`（已取消）。
- 期間是從「現在」往前推 `days` 天，**今天的訂單也算**。
- 金額用訂單明細的 `total_price`（售價 × 件數），沒扣折價券。
- SKU 已被刪除的訂單明細不計入。

> 🔒 **只有 PRODUCT、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。

**失敗回應：**

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 沒帶 token、token 無效或過期 | `尚未登入或登入已失效` |
| 403 | 其他部門的員工 token、會員 token | `沒有權限使用這個功能` |
| 500 | `days`、`limit` 不是數字 | `系統發生錯誤，請稍後再試` |

---

## 銷售趨勢 `GET /api/admin/product/analytics/trends`

比較「本期」和「上一個相同長度的期間」。

### Request

範例：`GET /api/admin/product/analytics/trends?days=30&limit=10`

`days=30` 時：本期是最近 30 天，上一期是再往前的 30 天。

### Response — 成功 `200 OK`

```json
[
  {
    "productId": 1100,
    "slug": "men-486087",
    "name": "小羊毛圓領毛衣(長袖)(圖紋)",
    "imageUrl": "img/products/men-486087/col09.jpg",
    "currentUnitsSold": 3,
    "previousUnitsSold": 0,
    "unitChange": 3,
    "changePercent": null,
    "currentRevenue": 3870,
    "previousRevenue": 0,
    "trend": "NEW"
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `productId`、`slug`、`name`、`imageUrl` | | 商品資料 |
| `currentUnitsSold` | number | 本期售出件數 |
| `previousUnitsSold` | number | 上一期售出件數 |
| `unitChange` | number | 件數差異 = 本期 − 上一期 |
| `changePercent` | number \| null | 銷量變化 %，四捨五入到小數 1 位；**上一期是 0 時是 `null`** |
| `currentRevenue` | number | 本期銷售金額 |
| `previousRevenue` | number | 上一期銷售金額 |
| `trend` | string | 趨勢方向，見下表 |

| `trend` | 條件 |
|---|---|
| `NEW` | 上一期 0 件，本期有賣 |
| `UP` | 本期 > 上一期 |
| `DOWN` | 本期 < 上一期 |
| `STABLE` | 本期 = 上一期 |

**手動推演：**

| 本期 | 上一期 | `unitChange` | `changePercent` | `trend` |
|---|---|---|---|---|
| 3 | 0 | 3 | `null` | `NEW` |
| 15 | 10 | 5 | 50.0 | `UP` |
| 5 | 10 | -5 | -50.0 | `DOWN` |
| 10 | 10 | 0 | 0.0 | `STABLE` |
| 0 | 4 | -4 | -100.0 | `DOWN` |

> 順序是**本期熱銷排行在前**，後面接只有上一期有賣的商品，最後取前 `limit` 筆。

### 過程中做了什麼

```
前端 GET /api/admin/product/analytics/trends?...
   │
   ▼
① ProductSalesAnalyticsService.getSalesTrends()   ← @Transactional(readOnly = true)
   ├─ 把 days 限制在 1 ~ 365、limit 限制在 1 ~ 100
   ├─ 查本期、上一期各商品的銷售
   ├─ 商品清單 = 本期的商品（照排行）+ 只有上一期有賣的商品
   ├─ 每件商品算出差異、百分比、趨勢
   └─ 取前 limit 筆
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`order_items`、`orders`、`product_variants`、`products` 表，不會寫入任何資料。
