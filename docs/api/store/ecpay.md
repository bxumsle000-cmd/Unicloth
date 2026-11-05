# ECPay API（綠界付款）

- Controller：`controller/store/EcpayController.java`
- Service：`service/shop/ecpay/EcpayService.java`、`service/shop/ecpay/EcpayCallbackService.java`、`service/shop/ecpay/EcpayReturnUrlResolver.java`
- 共同前綴：`/api/payments/ecpay`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 建立付款 | POST | `/api/payments/ecpay/create` | 200 | `{ paymentUrl, parameters }` |
| 接收付款結果通知 | POST | `/api/payments/ecpay/notify` | 200 | 純文字 `1\|OK` |

**只有信用卡（`CREDIT`）和 ATM（`ATM`）的訂單走綠界**，貨到付款（`COD`）不需要。

**整個付款流程：**

```
① 前端 POST /api/checkout → 建立訂單，狀態 UNPAID（見 checkout.md）
② 前端 POST /api/payments/ecpay/create → 拿到付款網址和表單參數
③ 前端把參數放進表單，POST 到 paymentUrl → 瀏覽器跳到綠界付款頁
④ 顧客付款
⑤ 綠界的伺服器 POST /api/payments/ecpay/notify → 後端把訂單改成 PENDING
⑥ 顧客按「返回商店」→ 回到 ClientBackURL（預設 http://localhost:5173/orders）
```

> 綠界的伺服器連不到 `localhost`，所以通知網址用 `docker-compose` 裡 Cloudflare Tunnel 的對外網址。tunnel 沒開時，步驟 ⑤ 的通知不會進來，訂單會一直是 `UNPAID`，最後被逾時排程取消。

---

## 1. 建立付款 `POST /api/payments/ecpay/create`

> 🔒 **需要會員登入**：請求要帶 `Authorization: Bearer <token>`。沒帶 token 或 token 無效回 401 `尚未登入或登入已失效`；還沒補填會員資料回 403 `請先填寫會員資料`；帶員工 token 回 403 `沒有權限使用這個功能`。

### Request

```json
{
  "orderNo": "UC20261014-1234"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `orderNo` | string | ✅ | 不可空白；結帳回應裡的訂單編號 |

### Response — 成功 `200 OK`

```json
{
  "paymentUrl": "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  "parameters": {
    "MerchantID": "3002607",
    "MerchantTradeNo": "UC4F2A91C07B3E5D1826",
    "MerchantTradeDate": "2026/10/14 14:30:12",
    "PaymentType": "aio",
    "TotalAmount": "2660",
    "TradeDesc": "Unicloth Order Payment",
    "ItemName": "Unicloth Clothing Order",
    "ReturnURL": "https://xxxx.trycloudflare.com/api/payments/ecpay/notify",
    "ClientBackURL": "http://localhost:5173/orders",
    "ChoosePayment": "Credit",
    "EncryptType": "1",
    "CheckMacValue": "A1B2C3..."
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `paymentUrl` | string | 綠界付款網址，前端要把 `parameters` 用表單 POST 到這裡 |
| `parameters` | object | 表單要送的所有參數，**一個都不能改**，不然檢查碼會對不上 |

`parameters` 的內容：

| 欄位 | 說明 |
|---|---|
| `MerchantID` | 特店編號 |
| `MerchantTradeNo` | 這次交易的編號，`UC` + 18 碼英數字，共 20 字元 |
| `MerchantTradeDate` | 交易時間（台灣時間），格式 `yyyy/MM/dd HH:mm:ss` |
| `PaymentType` | 固定 `aio` |
| `TotalAmount` | 金額，取訂單的 `total` |
| `TradeDesc`、`ItemName` | 固定文字 |
| `ReturnURL` | 綠界付款結果通知後端的網址 |
| `ClientBackURL` | 綠界頁面「返回商店」按鈕的網址 |
| `ChoosePayment` | `CREDIT` 訂單是 `Credit`，`ATM` 訂單是 `ATM` |
| `EncryptType` | 固定 `1`（SHA256） |
| `CheckMacValue` | 檢查碼，綠界用它確認參數沒被改過 |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 沒有 body、JSON 語法錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 訂單的付款方式是貨到付款 | `此付款方式不支援綠界金流` |
| 400 | 訂單金額是空的或 ≤ 0 | `訂單付款金額不正確` |
| 403 | 帳號被停用 | `此帳號已被停用` |
| 404 | `orderNo` 不存在，**或不是自己的訂單** | `找不到此訂單` |
| 409 | 訂單已經付款 | `此訂單已經付款完成` |
| 409 | 訂單狀態不是 `UNPAID` | `目前訂單狀態無法付款` |
| 409 | 這張訂單已經有待付款的交易 | `此訂單已有待付款交易，請勿重複建立` |
| 409 | 這張訂單已經有付款成功的紀錄 | `此訂單已有付款成功紀錄` |
| 500 | `orderNo` 沒傳、是 `null` 或空白 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 POST /api/payments/ecpay/create
   │
   ▼
① EcpayController：orderNo 是空的 → 丟 IllegalArgumentException → 500
   │
   ▼
② EcpayService.createPayment()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 帳號被停用 → 403「此帳號已被停用」
   ├─ 用 orderNo 查訂單並鎖定（SELECT ... FOR UPDATE），避免同時建立兩筆付款
   │    └─ 查不到 → 404「找不到此訂單」
   ├─ 訂單不是這個會員的 → 404「找不到此訂單」
   ├─ paid_at 有值 → 409「此訂單已經付款完成」
   ├─ status 不是 UNPAID → 409「目前訂單狀態無法付款」
   ├─ 付款方式不是 CREDIT / ATM → 400「此付款方式不支援綠界金流」
   ├─ 金額是空的或 ≤ 0 → 400「訂單付款金額不正確」
   ├─ 已有 PENDING 的付款紀錄 → 409「此訂單已有待付款交易，請勿重複建立」
   ├─ 已有 PAID 的付款紀錄 → 409「此訂單已有付款成功紀錄」
   ├─ 產生 MerchantTradeNo，撞號就重抽
   ├─ 新增一筆 Payment（status = PENDING）
   ├─ EcpayReturnUrlResolver.resolve() 決定 ReturnURL
   └─ 組參數、算 CheckMacValue
   │
   ▼
③ 回 200 + { paymentUrl, parameters }
```

**資料庫影響：** `payments` 表新增一筆。

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `order_id` | 這張訂單 |
| `merchant_trade_no` | 程式產生 |
| `ecpay_trade_no` | `null`（付款成功才填） |
| `amount` | 訂單的 `total` |
| `payment_method` | 訂單的付款方式 |
| `status` | `PENDING` |
| `paid_at` | `null` |
| `created_at` | 寫入當下的時間 |

> ⚠️ 同一張訂單已有 `PENDING` 的付款紀錄時不能再建立，所以顧客關掉綠界頁面後，要等訂單被逾時排程取消，或由綠界通知付款失敗。

**補充：ReturnURL 怎麼決定？**

| 順序 | 條件 | ReturnURL |
|---|---|---|
| 1 | 有設定環境變數 `ECPAY_RETURN_URL` | 直接用它 |
| 2 | 問得到 tunnel（`http://127.0.0.1:20241/quicktunnel`）目前的網址 | `https://網址/api/payments/ecpay/notify` |
| 3 | tunnel 沒開 | `http://localhost:8080/api/payments/ecpay/notify`（綠界通知不會進來） |

---

## 2. 接收付款結果通知 `POST /api/payments/ecpay/notify`

**這支是綠界的伺服器呼叫的，前端不會用到。** 不需要 JWT，改用 `CheckMacValue` 確認通知真的是綠界發的。

### Request

`Content-Type` 要是 `application/x-www-form-urlencoded`，下面是後端會用到的欄位：

| 欄位 | 必填 | 說明 |
|---|---|---|
| `CheckMacValue` | ✅ | 檢查碼 |
| `MerchantID` | ✅ | 要跟我們的特店編號一樣 |
| `MerchantTradeNo` | ✅ | 建立付款時產生的交易編號 |
| `TradeAmt` | ✅ | 金額，要 > 0，而且跟付款紀錄、訂單的金額都一樣 |
| `RtnCode` | ✅ | `1` 是付款成功，其他是失敗 |
| `PaymentType` | ✅ | 付款方式，要跟訂單對得上（見下表） |
| `TradeNo` | 付款成功時 ✅ | 綠界的交易編號，最多 30 字 |
| `PaymentDate` | 付款成功時 ✅ | 付款時間，格式 `yyyy/MM/dd HH:mm:ss` |
| `SimulatePaid` | ❌ | `1` 代表綠界後台的模擬通知，不算真的付款 |

`PaymentType` 怎樣算對得上（不分大小寫）：

| 訂單付款方式 | 接受的 `PaymentType` |
|---|---|
| `CREDIT` | `Credit`、`Credit_` 開頭、`DigitalPayment_` 開頭 |
| `ATM` | `ATM`、`ATM_` 開頭 |

### Response

回的都是**純文字**，不是 JSON：

| 狀態碼 | body | 情況 |
|---|---|---|
| 200 | `1\|OK` | 處理完成：付款成功、付款失敗（訂單已取消）、模擬通知、重複通知都是這個 |
| 400 | `0\|ERROR` | 驗證沒過：資料是空的、檢查碼錯、特店編號不對、缺欄位、金額或付款方式對不上、找不到付款紀錄、付款時間格式錯 |
| 500 | `0\|ERROR` | 其他錯誤：已付款交易的資料不一致、訂單已取消卻收到付款成功、同一張訂單被不同交易重複付款 |

> 只有回 `1|OK` 綠界才會當成通知成功。
> `Content-Type` 不是 `application/x-www-form-urlencoded` 時，回 500 JSON `系統發生錯誤，請稍後再試`（綠界不會這樣送）。

### 通知的結果

| 情況 | 訂單 | 付款紀錄 |
|---|---|---|
| `SimulatePaid = 1` | 不變 | 不變 |
| `RtnCode = 1`，付款紀錄是 `PENDING` | `status` 改成 `PENDING`，填上 `paid_at` | `status` 改成 `PAID`，填上 `ecpay_trade_no`、`paid_at` |
| `RtnCode = 1`，付款紀錄已經是 `PAID`（重複通知） | 不變 | 不變 |
| `RtnCode` 不是 1，付款紀錄 `PENDING`、訂單 `UNPAID` | 取消（`CANCELLED`），還原庫存和折價券 | `status` 改成 `CANCELLED` |
| `RtnCode` 不是 1，其他狀態 | 不變 | 不變 |

### 過程中做了什麼

```
綠界 POST /api/payments/ecpay/notify
   │
   ▼
① EcpayCallbackService.handleNotification()   ← 整段包在 @Transactional 裡
   ├─ 通知資料是空的 → 400
   ├─ 驗證 CheckMacValue → 不對 → 400
   ├─ MerchantID 跟我們的不一樣 → 400
   ├─ 檢查 MerchantTradeNo、TradeAmt、RtnCode、PaymentType 都有值，金額 > 0 → 不對 → 400
   ├─ 用 MerchantTradeNo 查付款紀錄 → 查不到 → 400
   ├─ 先鎖訂單、再鎖付款紀錄（順序跟建立付款一樣，避免死結），重新讀一次最新狀態
   ├─ 金額跟付款紀錄或訂單不一樣 → 400
   ├─ 付款方式對不上 → 400
   ├─ SimulatePaid = 1 → 結束，回 1|OK（不動資料）
   ├─ RtnCode 不是 1：
   │    ├─ 付款紀錄 PENDING + 訂單 UNPAID + 還沒付款 → OrderService.cancelOrder()
   │    └─ 回 1|OK
   ├─ 檢查 TradeNo（最多 30 字）、PaymentDate 格式 → 不對 → 400
   ├─ 付款紀錄已經是 PAID：
   │    ├─ TradeNo 不一樣或訂單沒有 paid_at → 500（要人工對帳）
   │    └─ 重複通知 → 回 1|OK（不動資料）
   ├─ 付款紀錄不是 PENDING → 500
   ├─ 訂單已取消 → 500（要人工確認）
   ├─ 訂單已經有 paid_at → 500（要人工對帳）
   └─ 更新付款紀錄和訂單
   │
   ▼
② 交易 commit 成功才回 200 + 1|OK
```

**資料庫影響：** 見上面「通知的結果」。訂單被取消時，另外會把 `product_variants.stock` 加回去，並清掉那張券的 `member_coupons.used_at`、`order_id`。

**補充：為什麼不用 JWT？**
這支是綠界的伺服器呼叫的，它沒有會員的 token。改用 `CheckMacValue` 把關：綠界用只有雙方知道的 HashKey、HashIV 算出檢查碼，後端用同樣的方法再算一次，對得上才相信這個通知。
