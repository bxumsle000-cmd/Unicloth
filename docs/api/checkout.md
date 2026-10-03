# Checkout API（結帳）

- Controller：`controller/CheckoutController.java`
- Service：`service/CheckoutService.java`
- 共同前綴：`/api/checkout`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 結帳 | POST | `/api/checkout` | 201 | 訂單摘要 |

**結帳只買「勾選」的購物車項目**：前端把要買的購物車項目 id 放在 `cartItemIdList` 傳上來，沒勾的會留在購物車。

> ⚠️ **目前是開發用的假登入**：結帳的對象是「目前登入的會員」，而 `security/CurrentMember.java` **寫死會員 id = 1**，不會看前端帶的 token。

---

## 1. 結帳 `POST /api/checkout`

### Request

```json
{
  "receiverName": "王小美",
  "receiverPhone": "0912345678",
  "receiverEmail": "amy@example.com",
  "shippingMethod": "HOME",
  "shippingAddress": "台北市信義區市府路1號",
  "paymentMethod": "CREDIT",
  "note": "請放管理室",
  "memberCouponId": 5,
  "cartItemIdList": [12, 13]
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `receiverName` | string | ✅ | 不可空白、最多 50 字 |
| `receiverPhone` | string | ✅ | 不可空白、最多 20 字（**目前沒檢查是不是手機格式**） |
| `receiverEmail` | string | ❌ | 可以不傳或傳 `null`；有傳的話要是 Email 格式、最多 255 字 |
| `shippingMethod` | string | ✅ | `HOME`（宅配）/ `CVS`（超商取貨），**必須大寫** |
| `shippingAddress` | string | ✅ | 不可空白、最多 255 字；宅配填地址，超商取貨填門市名 |
| `paymentMethod` | string | ✅ | `CREDIT`（信用卡）/ `ATM`（ATM 轉帳）/ `COD`（貨到付款），**必須大寫** |
| `note` | string | ❌ | 可以不傳或傳 `null`；有傳的話最多 255 字 |
| `memberCouponId` | number | ❌ | 要用的折價券；**不用券就傳 `null` 或不傳**。值是「可用折價券」API 回應裡的 `id`（會員持有的那張券，不是券的範本 id） |
| `cartItemIdList` | number[] | ✅ | 至少一個；值是「我的購物車」回應裡的 `id` |

> `shippingMethod` 傳小寫 `"home"` 或不存在的值，JSON 會轉不過去，回 400 `請求內容格式錯誤，請確認欄位值是否正確`。
> `cartItemIdList` 裡**不要放重複的 id**：例如 `[12, 12]` 會被當成「有勾選的商品不在你的購物車裡」，回 400（原因見下面「過程中做了什麼」的步驟 ③）。

### Response — 成功 `201 Created`

```json
{
  "orderNo": "UC20261003-0427",
  "createdAt": "2026-10-03T14:30:12.123456",
  "receiverName": "王小美",
  "receiverPhone": "0912345678",
  "shippingMethod": "HOME",
  "paymentMethod": "CREDIT",
  "shippingAddress": "台北市信義區市府路1號",
  "total": 2660
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `orderNo` | string | 訂單編號，格式 `UC` + 日期 `yyyyMMdd` + `-` + 4 位隨機數字 |
| `createdAt` | string | 下單時間，格式 `yyyy-MM-ddTHH:mm:ss`（可能帶小數秒） |
| `receiverName` | string | 收件人 |
| `receiverPhone` | string | 收件人手機 |
| `shippingMethod` | string | `HOME` / `CVS` |
| `paymentMethod` | string | `CREDIT` / `ATM` / `COD` |
| `shippingAddress` | string | 宅配地址或超商門市名 |
| `total` | number | 實付金額 = 商品小計 − 折抵 + 運費 |

> 回應**沒有**商品小計、折抵、運費、商品明細，只有最後的 `total`。要看完整內容請呼叫「我的訂單」`GET /api/orders`。
> `createdAt` 小數秒的位數我**沒有實際確認**，這是推測；前端顯示日期時建議只取前面的 `yyyy-MM-dd`。

### 金額怎麼算

| 項目 | 規則 |
|---|---|
| 商品小計 `subtotal` | 每一項 `商品現在的售價 × 數量` 加總 |
| 折抵 `discount` | 沒用券是 `0`；`AMOUNT` 券 = `min(券面額, subtotal)`；`PERCENT` 券 = `subtotal × value / 100`，小數無條件捨去 |
| 運費 `shippingFee` | `subtotal ≥ 2500` 免運（`0`），否則 `50` |
| 實付 `total` | `subtotal − discount + shippingFee` |

**手動推演：**

| 小計 | 用的券 | 折抵 | 運費 | 實付 |
|---|---|---|---|---|
| 800 | 不用券 | 0 | 50 | **850** |
| 800 | 滿 500 折 50（`AMOUNT`, value 50） | 50 | 50 | **800** |
| 2600 | 打 9 折（`PERCENT`, value 10） | 260 | 0 | **2340** |
| 2600 | 打 85 折（`PERCENT`, value 15） | 390 | 0 | **2210** |
| 1999 | 打 9 折（`PERCENT`, value 10） | 199（199.9 捨去） | 50 | **1850** |

> `PERCENT` 的 `value` 是「折幾 %」：`value = 10` 是打 9 折，`value = 15` 是打 85 折。

> **免運是看「折抵前」的小計**：小計 2600 用了 300 元的券，實際只付 2300，還是免運。
> 折抵規則跟「可用折價券」API（`UsableCouponResponse`）顯示的金額是同一套，**改規則時兩邊要一起改**。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`receiverName: 不得是空白; cartItemIdList: 請至少勾選一件商品` |
| 400 | 其他欄位格式錯誤（例如 `shippingMethod` 傳小寫） | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | `cartItemIdList` 裡有 id 不是自己購物車的、已經被刪掉了，或有重複的 id | `有勾選的商品不在你的購物車裡，請重新整理購物車` |
| 400 | 小計沒達到折價券的最低消費 | `未達這張折價券的最低消費` |
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |
| 404 | `memberCouponId` 不存在，**或不是自己的券** | `沒有找到這張折價券` |
| 409 | 勾選的商品有已下架的 | `「商品名稱」已下架，請先從購物車移除` |
| 409 | 折價券已經用過（包含兩個請求同時用同一張券，搶輸的那一個） | `這張折價券已經使用過` |
| 409 | 折價券已過期 | `這張折價券已過期` |
| 409 | 庫存不夠 | `「商品名稱」庫存不足` |

> **任何一個錯誤都會讓整筆結帳還原**：就算庫存已經扣了一半才發現第二件不夠，前面扣掉的也會加回去，不會有「扣了庫存卻沒有訂單」的情況。

### 過程中做了什麼

```
前端 POST /api/checkout
   │
   ▼
① Spring 把 JSON 轉成 CheckoutRequest
   └─ 轉不過去（JSON 語法錯、enum 值不對）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400（一次列出所有錯的欄位）
   │
   ▼
③ CheckoutService.checkout()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用「目前會員 + cartItemIdList」查購物車項目，SKU、商品一起撈（join fetch）
   │    └─ 撈到的筆數 ≠ 傳上來的 id 數量 → 400「有勾選的商品不在你的購物車裡…」
   ├─ 逐項檢查商品是不是 ON_SALE，同時加總小計
   │    └─ 有下架的 → 409「「商品名稱」已下架…」
   ├─ 有傳 memberCouponId 才處理折價券：
   │    ├─ 用「這個 id + 目前會員」查券
   │    │    └─ 查不到 → 404「沒有找到這張折價券」
   │    ├─ 已使用過 → 409「這張折價券已經使用過」
   │    ├─ 已過期 → 409「這張折價券已過期」
   │    ├─ 小計 < 最低消費 → 400「未達這張折價券的最低消費」
   │    └─ 依券的類型算折抵金額
   ├─ 算運費、實付金額
   ├─ 逐項扣庫存（一條 UPDATE 同時檢查 + 扣）
   │    └─ 更新 0 筆 → 409「「商品名稱」庫存不足」
   ├─ 產生訂單編號，撞號就重抽
   ├─ 存訂單主檔（orders），status 預設 PENDING
   ├─ 存訂單明細（order_items），商品資料複製一份當快照
   ├─ 有用券 → 標記這張券已使用、記錄用在哪張訂單（一條 UPDATE 同時檢查「還沒用過」+ 標記）
   │    └─ 更新 0 筆（被同時結帳的另一個請求搶先用掉）→ 409「這張折價券已經使用過」
   └─ 從購物車刪掉已結帳的項目
   │
   ▼
④ 交易結束，整筆 commit
   │
   ▼
⑤ 回 201 + 訂單摘要 JSON
```

**為什麼重複的 id 會失敗？** 手動推演一下：傳 `[12, 12]`，資料庫查詢條件是 `id in (12, 12)`，只會撈到 **1** 筆；但傳上來的 list 長度是 **2**，1 ≠ 2，就被當成「有 id 不在購物車裡」。

**補充：扣庫存為什麼用一條 UPDATE？**

```sql
UPDATE product_variants SET stock = stock - :qty
WHERE id = :variantId AND stock >= :qty
```

「檢查庫存夠不夠」和「扣掉」在資料庫裡是同一個動作，不會被別人插隊。如果分成「先查 → 再扣」兩步，兩個人同時買最後 1 件時，可能兩人都查到「還有 1 件」，結果賣出 2 件（超賣）。

**補充：標記折價券已使用也是同一招**

```sql
UPDATE member_coupons SET used_at = :usedAt, order_id = :orderId
WHERE id = :id AND used_at IS NULL
```

前面「已使用過 → 409」那個檢查是先讀再判斷，兩個請求同時進來時可能都通過；真正把關的是這條 UPDATE。手動推演：A、B 同時用券 5 號，A 先執行 UPDATE（`used_at` 是 `NULL`，更新 1 筆）；B 執行時資料庫會等 A commit 完，再看一次 `used_at`，已經不是 `NULL`，更新 0 筆 → 回 409，B 的訂單、扣掉的庫存全部還原。
`CheckoutCouponConcurrencyTest` 用兩個執行緒實際測過這個情況。

**補充：為什麼訂單明細要存「快照」？**
商品之後可能改名、改價、甚至刪除。訂單明細在下單當下就把商品名稱、顏色、尺寸、圖片、單價複製一份存起來，歷史訂單才不會跟著變。

### 資料庫影響

| 表 | 動作 |
|---|---|
| `product_variants` | 每個結帳的 SKU `stock` 減掉購買數量 |
| `orders` | 新增一筆 |
| `order_items` | 每個結帳的購物車項目新增一筆 |
| `member_coupons` | 有用券時，那一張的 `used_at`、`order_id` 被填上 |
| `cart_items` | 刪除已結帳的項目（沒勾的留著） |

`orders` 新增那筆：

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `order_no` | 程式產生，例：`UC20261003-0427` |
| `member_id` | 目前登入的會員 |
| `status` | 固定 `PENDING`（訂單確認中） |
| `receiver_name`、`receiver_phone`、`receiver_email`、`shipping_method`、`shipping_address`、`payment_method`、`note` | Request 原封不動 |
| `subtotal`、`discount`、`shipping_fee`、`total` | 依上面「金額怎麼算」 |
| `member_coupon_id` | 有用券就是 `memberCouponId`，沒用是 `null` |
| `paid_at`、`shipped_at`、`completed_at` | `null`（目前沒有地方會填） |
| `created_at` | 寫入當下的時間 |

`order_items` 每一筆：

| 欄位 | 值從哪來 |
|---|---|
| `order_id` | 剛建立的訂單 |
| `variant_id` | 購物車項目的 SKU |
| `product_name` | 商品名稱（快照） |
| `color`、`size` | SKU 的顏色、尺寸（快照） |
| `image_url` | SKU 的圖片（快照） |
| `unit_price` | 商品**現在的**售價（快照） |
| `qty` | 購物車項目的數量 |
| `total_price` | `unit_price × qty` |
