# Admin Order API（訂單物流後台）

- Controller：`controller/admin/AdminOrderController.java`
- Service：`service/admin/AdminOrderService.java`
- 共同前綴：`/api/admin/order/orders`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 訂單列表 | GET | `/api/admin/order/orders` | 200 | 訂單摘要（分頁） |
| 訂單詳細資料 | GET | `/api/admin/order/orders/{orderId}` | 200 | 完整訂單 |
| 確認出貨 | PATCH | `/api/admin/order/orders/{orderId}/ship` | 200 | 更新後的完整訂單 |
| 取消訂單 | PATCH | `/api/admin/order/orders/{orderId}/cancel` | 200 | 更新後的完整訂單 |
| 確認送達 | PATCH | `/api/admin/order/orders/{orderId}/deliver` | 200 | 更新後的完整訂單 |
| 確認取貨 | PATCH | `/api/admin/order/orders/{orderId}/pickup` | 200 | 更新後的完整訂單 |

**`{orderId}` 是什麼？** `orders` 表的主鍵（列表回應裡的 `id`），不是給使用者看的 `orderNo`。

**訂單狀態怎麼走：**

```
UNPAID（未付款）── 綠界付款成功 ──▶ PENDING（訂單確認中）── 出貨 ──▶ SHIPPED（已出貨）
                                       │                                 │
                                       │ 取消                            │ 送達
                                       ▼                                 ▼
                                  CANCELLED（已取消）              DELIVERED（已送達）
                                                                         │
                                                                         │ 取貨
                                                                         ▼
                                                                 PICKED_UP（取貨完畢）
```

| 動作 | 只有這個狀態能做 |
|---|---|
| 確認出貨 | `PENDING` |
| 取消訂單 | `PENDING` |
| 確認送達 | `SHIPPED` |
| 確認取貨 | `DELIVERED` |

> 貨到付款的訂單結帳後直接是 `PENDING`。`UNPAID` 的訂單後台不能取消，會由逾時排程或綠界付款失敗通知取消。

> 🔒 **只有 ORDER、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
>
> 下面各支 API 的「失敗」表格就不再重複列這兩種。

---

## 1. 訂單列表 `GET /api/admin/order/orders`

### Request

全部都是選填，沒帶就是不篩。

| 參數 | 位置 | 型別 | 說明 |
|---|---|---|---|
| `keyword` | 網址 | string | 訂單編號、會員 Email、收件人「包含」這段文字就算，不分大小寫；前後空白會去掉 |
| `status` | 網址 | string | `UNPAID` / `PENDING` / `SHIPPED` / `DELIVERED` / `PICKED_UP` / `CANCELLED` |
| `shippingMethod` | 網址 | string | `HOME` / `CVS` |
| `page` | 網址 | number | 第幾頁，**從 0 開始**；預設 `0` |
| `size` | 網址 | number | 一頁幾筆；預設 `20` |
| `sort` | 網址 | string | 排序；預設 `createdAt,desc`（最新的在前面） |

範例：`GET /api/admin/order/orders?keyword=UC2026&status=PENDING&shippingMethod=HOME&page=0&size=20`

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "id": 10002,
      "orderNo": "UC20261103-5181",
      "createdAt": "2026-11-03T15:21:24",
      "memberEmail": "amy@example.com",
      "receiverName": "王小美",
      "receiverPhone": "0912345678",
      "status": "PENDING",
      "shippingMethod": "HOME",
      "paymentMethod": "CREDIT",
      "shippingCarrier": null,
      "trackingNumber": null,
      "total": 1340
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 488,
    "totalPages": 25
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 訂單主鍵；詳細資料、出貨等操作要用 |
| `orderNo` | string | 訂單編號 |
| `createdAt` | string | 下單時間 |
| `memberEmail` | string | 會員 Email |
| `receiverName` | string | 收件人 |
| `receiverPhone` | string | 收件人手機 |
| `status` | string | 訂單狀態 |
| `shippingMethod` | string | `HOME` / `CVS` |
| `paymentMethod` | string | `CREDIT` / `ATM` / `COD` |
| `shippingCarrier` | string \| null | 物流商；還沒出貨是 `null` |
| `trackingNumber` | string \| null | 物流追蹤碼；還沒出貨是 `null` |
| `total` | number | 實付金額 |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 500 | `status`、`shippingMethod` 不是上面列的值、`sort` 用了不存在的欄位 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/order/orders?...
   │
   ▼
① AdminOrderService.getOrders()   ← @Transactional(readOnly = true)
   ├─ keyword 去掉前後空白
   ├─ 查 orders，會員資料一起撈（EntityGraph），依條件篩選、分頁排序
   └─ 每一筆轉成 AdminOrderListResponse
   │
   ▼
② 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`orders`、`members` 表，不會寫入任何資料。

---

## 2. 訂單詳細資料 `GET /api/admin/order/orders/{orderId}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `orderId` | 路徑 | number | ✅ | 訂單主鍵 |

範例：`GET /api/admin/order/orders/10002`

### Response — 成功 `200 OK`

```json
{
  "id": 10002,
  "orderNo": "UC20261103-5181",
  "createdAt": "2026-11-03T15:21:24",
  "memberEmail": "amy@example.com",
  "receiverName": "王小美",
  "receiverPhone": "0912345678",
  "receiverEmail": "amy@example.com",
  "status": "SHIPPED",
  "shippingMethod": "HOME",
  "shippingAddress": "台北市信義區市府路1號",
  "shippingCarrier": "黑貓宅急便",
  "trackingNumber": "9012345678",
  "paymentMethod": "CREDIT",
  "note": null,
  "subtotal": 1290,
  "discount": 0,
  "shippingFee": 50,
  "total": 1340,
  "paidAt": "2026-11-03T15:25:00",
  "shippedAt": "2026-11-04T10:00:00",
  "deliveredAt": null,
  "completedAt": null,
  "items": [
    {
      "productName": "小羊毛圓領毛衣(長袖)(圖紋)",
      "color": "黑色",
      "size": "M",
      "imageUrl": "img/products/men-486087/col09.jpg",
      "unitPrice": 1290,
      "qty": 1,
      "totalPrice": 1290
    }
  ]
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id`、`orderNo`、`createdAt`、`memberEmail`、`receiverName`、`receiverPhone` | | 同「訂單列表」 |
| `receiverEmail` | string \| null | 收件人 Email |
| `status` | string | 訂單狀態 |
| `shippingMethod`、`paymentMethod` | string | 配送方式、付款方式 |
| `shippingAddress` | string | 宅配地址或超商門市名 |
| `shippingCarrier`、`trackingNumber` | string \| null | 物流商、追蹤碼 |
| `note` | string \| null | 結帳時填的備註 |
| `subtotal` | number | 商品小計 |
| `discount` | number | 折抵金額 |
| `shippingFee` | number | 運費 |
| `total` | number | 實付金額 = `subtotal − discount + shippingFee` |
| `paidAt` | string \| null | 付款時間 |
| `shippedAt` | string \| null | 出貨時間 |
| `deliveredAt` | string \| null | 送達時間 |
| `completedAt` | string \| null | 取貨完成時間 |
| `items` | array | 商品明細，見下表 |

`items` 每一筆（都是**下單當時**的快照，商品之後改名、改價不會變）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `productName` | string | 商品名稱 |
| `color`、`size` | string | 顏色、尺寸 |
| `imageUrl` | string \| null | 圖片 |
| `unitPrice` | number | 單價 |
| `qty` | number | 數量 |
| `totalPrice` | number | `unitPrice × qty` |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到訂單 | `找不到訂單：{orderId}`，例：`找不到訂單：999` |
| 500 | `orderId` 不是數字 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/order/orders/{orderId}
   │
   ▼
① AdminOrderService.getOrder()   ← @Transactional(readOnly = true)
   ├─ 用 id 查訂單 → 查不到 → 404「找不到訂單：{orderId}」
   ├─ 查這張訂單的 order_items
   └─ 組成 AdminOrderDetailResponse
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 只有「讀」`orders`、`order_items`、`members` 表，不會寫入任何資料。

---

## 3. 確認出貨 `PATCH /api/admin/order/orders/{orderId}/ship`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `orderId` | 路徑 | number | ✅ | 訂單主鍵 |

```json
{
  "shippingCarrier": "黑貓宅急便",
  "trackingNumber": "9012345678"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `shippingCarrier` | string | ✅ | 不可空白（訊息：`請填寫物流商`）；最多 50 字（訊息：`物流商不得超過 50 個字`）；前後空白會去掉 |
| `trackingNumber` | string | ✅ | 不可空白（訊息：`請填寫物流追蹤碼`）；最多 100 字（訊息：`物流追蹤碼不得超過 100 個字`）；前後空白會去掉 |

### Response — 成功 `200 OK`

更新後的完整訂單，格式同「訂單詳細資料」。`status` 是 `SHIPPED`，`shippedAt` 是現在時間。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`shippingCarrier: 請填寫物流商; trackingNumber: 請填寫物流追蹤碼` |
| 404 | 找不到訂單 | `找不到訂單：{orderId}` |
| 409 | 狀態不是 `PENDING` | `只有「訂單確認中」的訂單可以出貨，目前狀態為：{狀態中文}`，例：`…目前狀態為：已取消` |

### 過程中做了什麼

```
前端 PATCH /api/admin/order/orders/{orderId}/ship
   │
   ▼
① @Valid 檢查 ShipOrderRequest
   └─ 沒過 → 400
   │
   ▼
② AdminOrderService.shipOrder()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查訂單 → 查不到 → 404
   ├─ 狀態不是 PENDING → 409
   └─ 設定物流商、追蹤碼、status = SHIPPED、shipped_at = 現在
   │
   ▼
③ 回 200 + 完整訂單
```

**資料庫影響：** `orders` 表更新一筆的 `shipping_carrier`、`tracking_number`、`status`、`shipped_at`。

---

## 4. 取消訂單 `PATCH /api/admin/order/orders/{orderId}/cancel`

出貨前取消訂單。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `orderId` | 路徑 | number | ✅ | 訂單主鍵 |

不需要 body。

### Response — 成功 `200 OK`

更新後的完整訂單，格式同「訂單詳細資料」。`status` 是 `CANCELLED`。

> ⚠️ **不會自動退款**：已付款的訂單取消後，付款紀錄維持 `PAID`，退款要到綠界另外處理。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到訂單 | `找不到訂單：{orderId}` |
| 409 | 狀態不是 `PENDING` | `只有「訂單確認中」且尚未出貨的訂單可以取消，目前狀態為：{狀態中文}` |

### 過程中做了什麼

```
前端 PATCH /api/admin/order/orders/{orderId}/cancel
   │
   ▼
① AdminOrderService.cancelOrder()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查訂單 → 查不到 → 404
   ├─ 狀態不是 PENDING → 409
   ├─ 每一項明細把庫存加回去（SKU 已被刪除的就跳過）
   ├─ 有用券 → 清掉券的 used_at、order_id，會員可以再用（前提是券還沒過期）
   ├─ 等待付款中的付款紀錄改成 CANCELLED
   └─ status = CANCELLED
   │
   ▼
② 回 200 + 完整訂單
```

**資料庫影響：**

| 表 | 動作 |
|---|---|
| `orders` | 這張訂單 `status` 改成 `CANCELLED` |
| `product_variants` | 每個 SKU 的 `stock` 加回購買數量 |
| `member_coupons` | 有用券時，那一張的 `used_at`、`order_id` 清成 `null` |
| `payments` | `PENDING` 的付款紀錄改成 `CANCELLED`；`PAID` 的不動 |

> 購物車不還原：已結帳的項目不會再放回購物車。

---

## 5. 確認送達 `PATCH /api/admin/order/orders/{orderId}/deliver`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `orderId` | 路徑 | number | ✅ | 訂單主鍵 |

不需要 body。送達時間由後端記錄，不接收前端傳的時間。

### Response — 成功 `200 OK`

更新後的完整訂單。`status` 是 `DELIVERED`，`deliveredAt` 是現在時間。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到訂單 | `找不到訂單：{orderId}` |
| 409 | 狀態不是 `SHIPPED` | `只有「已出貨」的訂單可以確認送達，目前狀態為：{狀態中文}` |

### 過程中做了什麼

```
前端 PATCH /api/admin/order/orders/{orderId}/deliver
   │
   ▼
① AdminOrderService.markDelivered()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查訂單 → 查不到 → 404
   ├─ 狀態不是 SHIPPED → 409
   └─ status = DELIVERED、delivered_at = 現在
   │
   ▼
② 回 200 + 完整訂單
```

**資料庫影響：** `orders` 表更新一筆的 `status`、`delivered_at`。

---

## 6. 確認取貨 `PATCH /api/admin/order/orders/{orderId}/pickup`

目前沒有串接物流商，由物流人員在後台手動確認。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `orderId` | 路徑 | number | ✅ | 訂單主鍵 |

不需要 body。

### Response — 成功 `200 OK`

更新後的完整訂單。`status` 是 `PICKED_UP`，`completedAt` 是現在時間。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到訂單 | `找不到訂單：{orderId}` |
| 409 | 狀態不是 `DELIVERED` | `只有「已送達」的訂單可以確認取貨，目前狀態為：{狀態中文}` |

### 過程中做了什麼

```
前端 PATCH /api/admin/order/orders/{orderId}/pickup
   │
   ▼
① AdminOrderService.markPickedUp()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查訂單 → 查不到 → 404
   ├─ 狀態不是 DELIVERED → 409
   └─ status = PICKED_UP、completed_at = 現在
   │
   ▼
② 回 200 + 完整訂單
```

**資料庫影響：** `orders` 表更新一筆的 `status`、`completed_at`。
