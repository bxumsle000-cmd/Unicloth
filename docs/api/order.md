# Order API（我的訂單）

- Controller：`controller/OrderController.java`
- Service：`service/OrderService.java`
- 共同前綴：`/api/orders`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 我的訂單 | GET | `/api/orders` | 200 | 訂單清單（含明細） |

訂單是在結帳時建立的，請看 [checkout.md](checkout.md)。

> ⚠️ **目前是開發用的假登入**：查的是「目前登入的會員」的訂單，而 `security/CurrentMember.java` **寫死會員 id = 1**，不會看前端帶的 token。

---

## 1. 我的訂單 `GET /api/orders`

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  {
    "orderNo": "UC20261003-0427",
    "createdAt": "2026-10-03T14:30:12.123456",
    "receiverName": "王小美",
    "receiverPhone": "0912345678",
    "shippingMethod": "HOME",
    "paymentMethod": "CREDIT",
    "shippingAddress": "台北市信義區市府路1號",
    "total": 2340,
    "status": "PENDING",
    "note": "請放管理室",
    "orderItemResponseList": [
      {
        "productName": "DRY-EX防曬連帽外套",
        "color": "藍色",
        "size": "M",
        "imageUrl": "img/products/men-487511/col66.jpg",
        "qty": 2,
        "totalPrice": 780
      }
    ]
  }
]
```

**訂單本身：**

| 欄位 | 型別 | 說明 |
|---|---|---|
| `orderNo` | string | 訂單編號，例：`UC20261003-0427` |
| `createdAt` | string | 下單時間，格式 `yyyy-MM-ddTHH:mm:ss`（可能帶小數秒） |
| `receiverName` | string | 收件人 |
| `receiverPhone` | string | 收件人手機 |
| `shippingMethod` | string | `HOME`（宅配）/ `CVS`（超商取貨） |
| `paymentMethod` | string | `CREDIT`（信用卡）/ `ATM`（ATM 轉帳）/ `COD`（貨到付款） |
| `shippingAddress` | string | 宅配地址或超商門市名 |
| `total` | number | 實付金額（商品小計 − 折抵 + 運費） |
| `status` | string | 訂單狀態，見下表 |
| `note` | string \| null | 結帳時填的備註；沒填是 `null` |
| `orderItemResponseList` | array | 這張訂單買了哪些商品 |

**`orderItemResponseList` 每一筆：**

| 欄位 | 型別 | 說明 |
|---|---|---|
| `productName` | string | 商品名稱（**下單當時**的名稱） |
| `color` | string | 顏色 |
| `size` | string | 尺寸 |
| `imageUrl` | string \| null | 圖片 |
| `qty` | number | 數量 |
| `totalPrice` | number | 這一項的金額 = 下單當時單價 × 數量 |

**`status` 有哪些值：**

| 值 | 中文（`OrderStatus.label`） |
|---|---|
| `PENDING` | 訂單確認中 |
| `SHIPPED` | 已出貨 |
| `DELIVERED` | 已送達 |
| `PICKED_UP` | 取貨完畢 |
| `CANCELLED` | 已取消 |

> 回的是英文大寫，中文要前端自己對照。目前**只有** `PENDING` 會出現：結帳建立的訂單都是 `PENDING`，專案裡還沒有任何改狀態的 API。

> 順序是**最新的訂單在前面**。
> 明細的內容是下單當下存的「快照」：商品之後改名、改價，這裡顯示的還是當時的資料。
> 沒有任何訂單時，回空陣列 `[]`。

> **回應裡沒有的東西**：訂單的 `id`、商品小計、折抵金額、運費、用了哪張券、收件人 Email、明細的單價。`orders` 表裡都有存，只是 `OrderResponse` 沒放進來；之後畫面需要的話要加欄位。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 GET /api/orders
   │
   ▼
① OrderService.getOrders()   ← @Transactional(readOnly = true)
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用會員 id 查 orders，照 created_at 由新到舊排
   └─ 每一張訂單：
        ├─ 再查一次這張訂單的 order_items
        └─ 組成 OrderResponse（明細轉成 OrderItemResponse）
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`orders`、`order_items` 表，不會寫入任何資料。

> ⚠️ 觀察到的小地方（不影響目前功能，供參考）：查明細是**每張訂單各查一次**。手動推演：會員有 10 張訂單 → 先查 1 次 `orders`，再查 10 次 `order_items`，總共 11 次查詢（這種情況叫 N+1 問題）。訂單少的時候沒差，訂單多了才會變慢。要改的話可以一次用所有訂單 id 查出全部明細，再在程式裡分組。
