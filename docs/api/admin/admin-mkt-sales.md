# Admin Mkt Sales API（行銷後台：銷售數據）

- Controller：`controller/admin/AdminMktSalesController.java`
- Service：`service/admin/AdminSalesService.java`
- Python 分析服務：`analytics/main.py`（`sales_overview.py`、`product_sales.py`、`order_structure.py`、`member_customers.py`、`coupon_performance.py`）
- 共同前綴：`/api/admin/mkt/sales`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 營收總覽 | GET | `/api/admin/mkt/sales/overview` | 200 | 指標 + 每日資料 |
| 營收總覽匯出 Excel | GET | `/api/admin/mkt/sales/overview/export` | 200 | `.xlsx` 檔案 |
| 商品銷售 | GET | `/api/admin/mkt/sales/products` | 200 | 指標 + 分類、顏色、尺寸統計 |
| 商品排行 | GET | `/api/admin/mkt/sales/products/rank` | 200 | 熱銷 / 滯銷排行（分頁） |
| 訂單結構 | GET | `/api/admin/mkt/sales/orders` | 200 | 指標 + 配送、付款、狀態、取消統計 |
| 會員與顧客 | GET | `/api/admin/mkt/sales/members` | 200 | 指標 + 新舊客、性別、年齡統計 |
| 折價券成效 | GET | `/api/admin/mkt/sales/coupons` | 200 | 指標 + 每張券的成效 |

**數字不是 Spring Boot 算的**：Spring Boot 只負責擋權限，再轉給 Python 分析服務（只開在本機 `127.0.0.1:8000`，前端連不到），Python 算好的 JSON 原樣回傳。

```
React → Spring Boot /api/admin/mkt/sales/**（擋權限）→ Python http://127.0.0.1:8000/sales/**
```

**期間 `range`（每支都一樣，匯出除外）：**

| `range` | 意思 |
|---|---|
| `7d` | 最近 7 天 |
| `30d` | 最近 30 天（預設） |
| `90d` | 最近 90 天 |
| `12m` | 營收總覽：已經過完的 12 個月；其他：最近 365 天 |

> **最後一天是昨天**，今天還沒過完不算。

**「有效訂單」**：排除 `UNPAID`（未付款）、`CANCELLED`（已取消）。**營業額** = 商品小計 − 折扣，不含運費。

> 🔒 **只有 MKT、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。
>
> **每一支都可能遇到的錯誤：**
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
> | `range` 不對 | 400 | `不認識的期間：{值}，只能是 7d, 30d, 90d, 12m` |
> | Python 服務出錯 | 502 | `銷售分析服務出錯了，請看 Python 那邊的錯誤訊息` |
> | Python 服務沒開 | 503 | `銷售分析服務沒有啟動，請執行 docker compose up -d` |
>
> 下面各支 API 的「失敗」表格就不再重複列這幾種。

**每一支共同的流程：**

```
前端 GET /api/admin/mkt/sales/...
   │
   ▼
① SecurityConfig：只有 MKT、ADMIN 能進
   │
   ▼
② AdminSalesService 組好網址，用 RestClient 呼叫 Python
   ├─ Python 回 4xx → 400 + Python 的 message（沒有 message 時是「查詢條件格式錯誤」）
   ├─ Python 回 5xx → 502
   └─ 連不到 Python → 503
   │
   ▼
③ Python 查資料庫、用 pandas 算好，回 JSON
   │
   ▼
④ Spring Boot 把 JSON 字串原樣回傳（不轉成 DTO）
```

**資料庫影響：** 這幾支都只有「讀」，不會寫入任何資料。

---

## 1. 營收總覽 `GET /api/admin/mkt/sales/overview`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `range` | 網址 | string | ❌ | 預設 `30d` |

範例：`GET /api/admin/mkt/sales/overview?range=7d`

### Response — 成功 `200 OK`

```json
{
  "start": "2026-10-29",
  "end": "2026-11-04",
  "unit": "day",
  "summary": {
    "current": { "revenue": 2170, "orders": 2, "avgOrderValue": 1085, "items": 3, "discount": 0 },
    "previous": { "revenue": 31721, "orders": 9, "avgOrderValue": 3525, "items": 30, "discount": 1238 }
  },
  "daily": [
    { "date": "2026-10-29", "revenue": 0, "orders": 0, "items": 0, "discount": 0 }
  ],
  "previousDaily": [
    { "date": "2026-10-22", "revenue": 10140, "orders": 2, "items": 6, "discount": 0 }
  ],
  "minDate": "2025-08-02",
  "maxDate": "2026-11-04"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `start`、`end` | string | 這段期間的第一天、最後一天 |
| `unit` | string | `day`：`daily` 一天一筆；`month`（`12m`）：一個月一筆，`date` 是每月 1 號 |
| `summary.current` | object | 這段期間的加總 |
| `summary.previous` | object | 上一段相同長度期間的加總 |
| `daily` | array | 這段期間每天（或每月）的資料，沒有訂單的日子補 0 |
| `previousDaily` | array | 上一段期間每天（或每月）的資料 |
| `minDate` | string \| null | 匯出 Excel 最早能選的日期（最早有有效訂單的那天）；沒有訂單是 `null` |
| `maxDate` | string | 匯出 Excel 最晚能選的日期（昨天） |

`summary.current`、`summary.previous`：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `revenue` | number | 營業額 |
| `orders` | number | 訂單數 |
| `avgOrderValue` | number | 客單價 = 營業額 ÷ 訂單數，四捨五入；沒有訂單是 `0` |
| `items` | number | 銷售件數 |
| `discount` | number | 折扣總額 |

`daily`、`previousDaily` 每一筆：`date`、`revenue`、`orders`、`items`、`discount`，意思同上。

---

## 2. 營收總覽匯出 Excel `GET /api/admin/mkt/sales/overview/export`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `start` | 網址 | string | ✅ | 開始日期，格式 `2026-10-01`，含當天 |
| `end` | 網址 | string | ✅ | 結束日期，格式 `2026-10-31`，含當天 |

範例：`GET /api/admin/mkt/sales/overview/export?start=2026-10-01&end=2026-10-31`

### Response — 成功 `200 OK`

回的是 Excel 檔案，不是 JSON：

| Header | 值 |
|---|---|
| `Content-Type` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `Content-Disposition` | `attachment; filename="sales-overview_2026-10-01_2026-10-31.xlsx"` |

工作表名稱是「營收總覽」，每天一列：

| 日期 | 營業額 | 客單價 | 銷售件數 | 折扣總額 |
|---|---|---|---|---|
| 2026/10/01 | 3,580 | 1,790 | 4 | 200 |

> 沒有訂單的日子也有一列，數字都是 0。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `start` 晚於 `end` | `開始日期不能晚於結束日期` |
| 500 | `start`、`end` 沒帶，或日期格式不對 | `系統發生錯誤，請稍後再試` |

---

## 3. 商品銷售 `GET /api/admin/mkt/sales/products`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `range` | 網址 | string | ❌ | 預設 `30d` |
| `main` | 網址 | number | ❌ | 主分類 id（分類樹第 1 層：女裝 / 男裝 / 童裝），不帶就是全部 |
| `sub` | 網址 | number | ❌ | 副分類 id（分類樹第 2 層）；**要帶 `sub` 就一定要帶 `main`** |

範例：`GET /api/admin/mkt/sales/products?range=30d&main=320&sub=346`

### Response — 成功 `200 OK`

```json
{
  "start": "2026-10-29",
  "end": "2026-11-04",
  "filter": { "main": null, "sub": null },
  "kpi": { "qty": 3, "soldProducts": 3, "onSaleProducts": 916, "slowProducts": 913 },
  "mainCategoryList": [
    { "id": 320, "name": "女裝", "amount": 2170, "percent": 100.0 },
    { "id": 230, "name": "男裝", "amount": 0, "percent": 0.0 },
    { "id": 424, "name": "童裝", "amount": 0, "percent": 0.0 }
  ],
  "subCategoryList": [
    { "mainId": 320, "mainName": "女裝", "id": 346, "name": "休閒襯衫．設計上衣．POLO衫", "amount": 990 }
  ],
  "color": {
    "topList": [{ "name": "原色", "qty": 1 }],
    "otherCount": 0,
    "otherQty": 0
  },
  "sizeGroupList": [
    {
      "key": "adult",
      "name": "成人",
      "note": "成人尺寸 XS～4XL；褲子腰圍（inch）、單一尺寸不列入",
      "list": [{ "size": "XS", "qty": 0 }, { "size": "M", "qty": 3 }]
    }
  ]
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `start`、`end` | string | 期間 |
| `filter.main`、`filter.sub` | object \| null | 目前的篩選：`{ id, name }`；沒篩是 `null` |
| `kpi.qty` | number | 賣出件數（**有套用篩選**，下同） |
| `kpi.soldProducts` | number | 有賣出的商品數 |
| `kpi.onSaleProducts` | number | 上架中的商品數 |
| `kpi.slowProducts` | number | 滯銷商品數 = 上架中但一件都沒賣出 |
| `mainCategoryList` | array | 主分類銷售額和佔比，固定照 女裝 / 男裝 / 童裝 排；**不受篩選影響** |
| `subCategoryList` | array | 副分類銷售額，金額大到小；沒選主分類時只取前 10 名，選了主分類就列出它底下有賣出的全部副分類 |
| `color.topList` | array | 件數前 10 名的顏色 `{ name, qty }` |
| `color.otherCount`、`color.otherQty` | number | 其餘顏色有幾種、合計幾件 |
| `sizeGroupList` | array | 尺寸統計的組別，見下表 |

`sizeGroupList` 有哪幾組：

| 篩選 | 組別 |
|---|---|
| 沒篩選 | `adult`（成人）、`kids`（童裝）兩組 |
| 選了主分類 | 童裝是 `kids`，女裝、男裝是 `adult` |
| 選了副分類 | 只有 `sub` 一組，列出這個分類實際有賣出的尺寸 |

> 銷售金額用 `order_items.total_price`（售價 × 件數），**沒扣折價券**，所以跟營收總覽的營業額對不起來是正常的。
> 只算 SKU 還存在的訂單明細，SKU 被刪除的明細不計入。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 帶了 `sub` 沒帶 `main` | `選副分類時也要帶主分類` |
| 400 | `main` 不是主分類 | `找不到主分類：{main}` |
| 400 | `sub` 不在這個主分類底下 | `副分類 {sub} 不在主分類 {main} 底下` |
| 500 | `main`、`sub` 不是數字 | `系統發生錯誤，請稍後再試` |

---

## 4. 商品排行 `GET /api/admin/mkt/sales/products/rank`

每頁固定 10 件。排行另外一支 API，換頁不用重算整頁。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `range` | 網址 | string | ❌ | 預設 `30d` |
| `main`、`sub` | 網址 | number | ❌ | 同「商品銷售」 |
| `type` | 網址 | string | ❌ | `hot`（熱銷，預設）/ `slow`（滯銷） |
| `page` | 網址 | number | ❌ | 第幾頁，**從 0 開始**；預設 `0` |

| `type` | 範圍 | 排序 |
|---|---|---|
| `hot` | 有賣出的商品 | 件數多的在前，一樣時金額高的在前 |
| `slow` | 上架中的商品 | 件數少的在前，一樣時庫存多的在前 |

範例：`GET /api/admin/mkt/sales/products/rank?type=slow&page=1`

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "rank": 11,
      "id": 960,
      "name": "AIRism棉質寬版圓領T恤(五分袖)",
      "mainName": "男裝",
      "subName": "T恤/背心/休閒",
      "price": 590,
      "onSale": false,
      "imageUrl": "img/products/men-482295/col18.jpg",
      "qty": 0,
      "amount": 0,
      "stock": 29087
    }
  ],
  "page": {
    "number": 1,
    "size": 10,
    "totalElements": 916,
    "totalPages": 92
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `rank` | number | 名次，從 1 開始；第 2 頁第一個是第 11 名 |
| `id` | number | 商品 id |
| `name` | string | 商品名稱 |
| `mainName`、`subName` | string | 主分類、副分類名稱 |
| `price` | number | 售價 |
| `onSale` | boolean | **是否特價中**（有原價），不是「是否上架」 |
| `imageUrl` | string \| null | 商品主圖 |
| `qty` | number | 這段期間賣出件數 |
| `amount` | number | 這段期間銷售金額 |
| `stock` | number | 現在的總庫存 |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `type` 不對 | `不認識的排行：{值}，只能是 hot, slow` |
| 400 | `page` 是負數 | `頁數不能小於 0` |
| 400 | `main`、`sub` 不對 | 同「商品銷售」 |
| 500 | `main`、`sub`、`page` 不是數字 | `系統發生錯誤，請稍後再試` |

---

## 5. 訂單結構 `GET /api/admin/mkt/sales/orders`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `range` | 網址 | string | ❌ | 預設 `30d` |
| `shipping` | 網址 | string | ❌ | `HOME` / `CVS`，不帶就是全部 |

範例：`GET /api/admin/mkt/sales/orders?range=30d&shipping=HOME`

### Response — 成功 `200 OK`

```json
{
  "start": "2026-10-06",
  "end": "2026-11-04",
  "filter": { "shipping": null },
  "kpi": { "orders": 31, "cancelRate": 9.7, "avgShipDays": 1.2, "latePending": 2 },
  "shippingList": [{ "key": "HOME", "name": "宅配", "count": 21 }],
  "paymentList": [{ "key": "CREDIT", "name": "信用卡", "count": 14 }],
  "statusList": [{ "key": "PENDING", "name": "訂單確認中", "count": 3 }],
  "shipSpeedList": [{ "name": "當天", "count": 13 }],
  "deliverList": [{ "name": "宅配：出貨 → 送達", "unit": "已送達", "avgDays": 1.7, "count": 16 }],
  "cancelList": [
    { "name": "信用卡", "reason": "未付款（30 分鐘）", "orders": 16, "cancelled": 1, "waiting": 0, "cancelRate": 6.3 }
  ]
}
```

（每個清單只列一筆當例子。）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `filter.shipping` | object \| null | 目前的篩選：`{ key, name }`；沒篩是 `null` |
| `kpi.orders` | number | 這段期間下的全部訂單（**含未付款、已取消**） |
| `kpi.cancelRate` | number \| null | 取消率（%）；沒有訂單是 `null` |
| `kpi.avgShipDays` | number \| null | 訂單成立到出貨平均幾天；沒有資料是 `null` |
| `kpi.latePending` | number | **現在**訂單確認中、成立超過 3 天還沒出貨的訂單數（不看期間） |
| `shippingList` | array | 有效訂單的配送方式分布：`HOME`、`CVS`；**不受篩選影響** |
| `paymentList` | array | 有效訂單的付款方式分布：`CREDIT`、`ATM`、`COD` |
| `statusList` | array | 全部訂單的狀態分布，照流程順序，0 筆也會列 |
| `shipSpeedList` | array | 出貨天數分布：當天、1 天、2 天、3 天、4 天、5 天以上 |
| `deliverList` | array | 配送天數：`avgDays` 平均幾天（沒有資料是 `null`）、`count` 筆數；有篩選配送方式時只給那一種 |
| `cancelList` | array | 取消分析，見下表 |

> **訂單成立時間**：貨到付款看 `created_at`，信用卡、ATM 看 `paid_at`。

`cancelList` 每一列：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `name` | string | 付款方式：`信用卡`、`ATM 轉帳`、`全部付款方式` |
| `reason` | string | 取消原因：`未付款（30 分鐘）`、`未付款（4 天）`、`出貨前由後台取消` |
| `orders` | number | 下單數 |
| `cancelled` | number | 因為這個原因取消的筆數 |
| `waiting` | number | 還不知道會不會被取消的筆數 |
| `cancelRate` | number \| null | 取消率（%）= `cancelled ÷ orders`；沒有訂單是 `null` |

> 資料庫沒有記錄取消原因，是用付款狀態推出來的：沒付款就被取消 → 未付款；已付款或貨到付款被取消 → 出貨前由後台取消。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `shipping` 不對 | `不認識的配送方式：{值}，只能是 HOME, CVS` |

---

## 6. 會員與顧客 `GET /api/admin/mkt/sales/members`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `range` | 網址 | string | ❌ | 預設 `30d` |
| `gender` | 網址 | string | ❌ | `female` / `male`，不帶就是全部 |
| `age` | 網址 | string | ❌ | `u24` / `25-34` / `35-44` / `45up`，不帶就是全部 |

範例：`GET /api/admin/mkt/sales/members?range=30d&gender=female&age=25-34`

### Response — 成功 `200 OK`

```json
{
  "start": "2026-10-06",
  "end": "2026-11-04",
  "filter": { "gender": null, "ageGroup": null },
  "kpi": { "buyers": 18, "newBuyers": 1, "returningBuyers": 17, "signups": 1 },
  "buyerTypeList": [
    { "name": "新客", "buyers": 1, "buyerPercent": 5.6, "amount": 6930, "amountPercent": 9.8, "avgAmount": 6930 }
  ],
  "genderList": [
    { "key": "female", "name": "女性", "buyers": 7, "amount": 40910, "avgAmount": 5844 }
  ],
  "ageGroupList": [
    { "key": "u24", "name": "24 歲以下", "buyers": 2, "amount": 2973, "avgAmount": 1486 }
  ],
  "topList": [
    { "id": 3, "name": "黃淑芬", "gender": "女性", "age": 47, "isNew": false, "amount": 15000, "orderCount": 3 }
  ],
  "signupList": [
    { "month": "2026/11", "count": 1, "partial": true }
  ]
}
```

（每個清單只列一筆當例子。）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `filter.gender`、`filter.ageGroup` | object \| null | 目前的篩選：`{ key, name }`；沒篩是 `null` |
| `kpi.buyers` | number | 這段期間有有效訂單的會員數 |
| `kpi.newBuyers` | number | 新客：第一筆有效訂單在這段期間內 |
| `kpi.returningBuyers` | number | 回購客：這段期間之前就買過 |
| `kpi.signups` | number | 這段期間新註冊的會員數 |
| `buyerTypeList` | array | 新客、回購客：人數 `buyers`、人數佔比 `buyerPercent`、消費金額 `amount`、金額佔比 `amountPercent`、平均每人消費 `avgAmount` |
| `genderList` | array | 依性別加總：`buyers`、`amount`、`avgAmount`；**只套用年齡層的篩選** |
| `ageGroupList` | array | 依年齡層加總，欄位同上；**只套用性別的篩選** |
| `topList` | array | 消費金額前 10 名，見下表 |
| `signupList` | array | 每月新註冊會員數，固定最近 12 個月，不受 `range` 影響，但會套用性別、年齡層的篩選；`partial` 是 `true` 代表那個月還沒過完 |

`topList` 每一筆：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 會員 id |
| `name` | string | 姓名；沒補填資料是 `（未填資料）` |
| `gender` | string \| null | `女性` / `男性` |
| `age` | number \| null | 今天幾歲 |
| `isNew` | boolean | 是不是新客 |
| `amount` | number | 這段期間的消費金額 |
| `orderCount` | number | 這段期間的訂單數 |

> 還沒補填資料的會員不知道性別、年齡，有篩選時一律不符合。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `gender` 不對 | `不認識的性別：{值}，只能是 female, male` |
| 400 | `age` 不對 | `不認識的年齡層：{值}，只能是 u24, 25-34, 35-44, 45up` |

---

## 7. 折價券成效 `GET /api/admin/mkt/sales/coupons`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `range` | 網址 | string | ❌ | 預設 `30d` |

範例：`GET /api/admin/mkt/sales/coupons?range=30d`

### Response — 成功 `200 OK`

```json
{
  "start": "2026-10-06",
  "end": "2026-11-04",
  "coupon": {
    "issued": 21,
    "used": 3,
    "usable": 17,
    "couponRevenue": 30761,
    "totalRevenue": 70820,
    "discount": 3288,
    "couponOrders": 10,
    "avgDiscount": 329
  },
  "couponList": [
    {
      "id": 2,
      "code": "SAVE10",
      "title": "全館 9 折券",
      "type": "PERCENT",
      "value": 10,
      "minSubtotal": 1490,
      "autoTrigger": null,
      "isActive": true,
      "issued": 7,
      "used": 3,
      "useRate": 42.9,
      "orders": 7,
      "revenue": 26901,
      "discount": 2988,
      "avgDiscount": 427
    }
  ],
  "compareList": [
    { "name": "有用券", "orders": 10, "orderPercent": 35.7, "revenue": 30761, "avgDiscount": 329, "aov": 3076 }
  ]
}
```

（每個清單只列一筆當例子。）

**兩種統計基準不一樣：**

| 統計 | 依什麼算進這段期間 |
|---|---|
| 發券（`issued`、`used`、`usable`、`useRate`） | 券的發券時間；狀態看現在 |
| 訂單（`orders`、`revenue`、`discount`） | 訂單的下單時間，只算有效訂單 |

`coupon` 整體：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `issued` | number | 這段期間發出幾張 |
| `used` | number | 其中已使用幾張 |
| `usable` | number | 其中還能用幾張 |
| `couponRevenue` | number | 有用券的訂單的營業額 |
| `totalRevenue` | number | 全部有效訂單的營業額 |
| `discount` | number | 折扣成本加總 |
| `couponOrders` | number | 有用券的訂單數 |
| `avgDiscount` | number \| null | 平均每張訂單折多少；沒有用券訂單是 `null` |

`couponList` 每張券一列，**依營業額由高到低**；這段期間沒發、也沒人用的券不列：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id`、`code`、`title`、`type`、`value`、`minSubtotal` | | 券的資料 |
| `autoTrigger` | string \| null | 自動發送時機 |
| `isActive` | boolean | 是否啟用 |
| `issued`、`used` | number | 發出幾張、已使用幾張 |
| `useRate` | number \| null | 使用率（%）；這段期間沒發是 `null` |
| `orders`、`revenue`、`discount` | number | 用這張券的訂單數、營業額、折扣 |
| `avgDiscount` | number \| null | 平均每張訂單折多少；沒有訂單是 `null` |

`compareList` 有用券、沒用券各一列：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `name` | string | `有用券` / `沒用券` |
| `orders` | number | 訂單數 |
| `orderPercent` | number \| null | 訂單佔比（%）；沒有訂單是 `null` |
| `revenue` | number | 營業額 |
| `avgDiscount` | number \| null | 平均折扣；沒有訂單是 `null` |
| `aov` | number \| null | 客單價；沒有訂單是 `null` |

### Response — 失敗

只有最上面列的共通錯誤。
