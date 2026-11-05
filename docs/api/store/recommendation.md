# Recommendation API（商品推薦）

- Controller：`controller/store/RecommendationController.java`
- Service：`service/shop/RecommendationService.java`
- 共同前綴：`/api/recommendations`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 取得推薦商品 | GET | `/api/recommendations` | 200 | 商品卡片清單（沒有分頁） |

**不需要登入**。帶會員 token 時會優先給個人化推薦，沒帶就給熱門商品。

---

## 1. 取得推薦商品 `GET /api/recommendations`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `limit` | 網址 | number | ❌ | 要幾件，預設 `12`；小於 1 當成 1，大於 24 當成 24 |

範例：`GET /api/recommendations?limit=12`

### Response — 成功 `200 OK`

```json
[
  {
    "slug": "men-486087",
    "name": "小羊毛圓領毛衣(長袖)(圖紋)",
    "price": 1290,
    "origPrice": null,
    "newArrival": false,
    "hot": false,
    "imageUrl": "img/products/men-486087/col09.jpg",
    "styles": [
      { "id": 2, "code": "natural", "name": "自然風" },
      { "id": 3, "code": "minimal", "name": "簡約" }
    ]
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `slug` | string | 商品字串 id，點進商品頁用 |
| `name` | string | 商品名稱 |
| `price` | number | 售價 |
| `origPrice` | number \| null | 原價；**有值且大於 `price` 時顯示特價** |
| `newArrival` | boolean | 是否顯示「新品」標籤 |
| `hot` | boolean | 是否顯示「熱門」標籤；**這支跟其他商品 API 不一樣**，見下面 |
| `imageUrl` | string \| null | 縮圖，沒有時是 `null` |
| `styles` | array | 商品的風格標籤，每一筆是 `{ id, code, name }`，順序不固定；沒有標籤是 `[]` |

**這支的 `hot` 怎麼算：** 商品手動設定成 HOT，**或**近 30 天賣出 5 件以上，就是 `true`。這只影響這支 API 的回傳，不會寫回資料庫。

**推薦的商品一定：** 上架中、至少有一個 SKU 還有庫存。

### 推薦的順序

| 身分 | 順序 |
|---|---|
| 訪客（沒帶 token）、員工 token | ① 近 30 天銷量排行 → ② 手動 HOT → ③ 其他上架商品（新的在前） |
| 會員 | ① 個人化推薦 → 不夠 `limit` 件時，用上面的順序補滿 |

**個人化推薦怎麼算：**

1. 看會員瀏覽過哪些商品（`member_product_views`），把每件商品的瀏覽次數加到它的風格上，得到「每個風格幾分」。
2. 找**沒看過**、上架中、有這些風格的商品，把它符合的風格分數加總。
3. 依總分高到低排；同分時依最近看過該風格的時間、手動 HOT、商品 id 排。

**手動推演：**

| 會員看過 | 瀏覽次數 | 商品的風格 |
|---|---|---|
| 商品 A | 3 次 | 日系、簡約 |
| 商品 B | 1 次 | 日系 |

風格分數：日系 3 + 1 = 4 分、簡約 3 分。

| 沒看過的商品 | 風格 | 總分 | 名次 |
|---|---|---|---|
| 商品 C | 日系、簡約 | 4 + 3 = 7 | 1 |
| 商品 D | 日系 | 4 | 2 |
| 商品 E | 簡約 | 3 | 3 |

> 近 30 天銷量只算有效訂單：排除 `UNPAID`（未付款）、`CANCELLED`（已取消）；依件數排，件數一樣時依金額。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 500 | `limit` 不是數字（例如 `limit=abc`） | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/recommendations?limit=...
   │
   ▼
① RecommendationService.getRecommendations()   ← @Transactional(readOnly = true)
   ├─ 把 limit 限制在 1 ~ 24
   ├─ 查近 30 天所有有效訂單的商品銷量
   ├─ CurrentMember.getCurrentIdOrNull()：有會員登入才拿得到 id
   ├─ 沒有會員 → 依銷量 → 手動 HOT → 其他上架商品，湊滿 limit 件
   ├─ 有會員：
   │    ├─ 查個人化推薦的商品，去掉全部缺貨的
   │    └─ 不足 limit 件 → 用銷量排行補滿（同一件商品不重複）
   └─ 每件轉成 ProductCardResponse，算出 hot
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`orders`、`order_items`、`products`、`product_variants`、`product_styles`、`styles`、`member_product_views` 表，不會寫入任何資料。
