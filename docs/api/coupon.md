# Coupon API（折價券）

- Controller：`controller/CouponController.java`
- Service：`service/CouponService.java`
- 共同前綴：`/api/coupon`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 我的折價券 | GET | `/api/coupon` | 200 | 我持有的所有券 |
| 結帳可選的券 | GET | `/api/coupon/usable?subtotal=...` | 200 | 未使用、未過期的券 + 這次能折多少 |
| 發券給會員 | POST | `/api/coupon` | 204 | 沒有 body |

前兩支不需要 body，參數放在網址上；「發券給會員」要帶 JSON body。

**兩種「券」不要搞混：**

| 名稱 | 資料表 | 是什麼 |
|---|---|---|
| 折價券範本（`Coupon`） | `coupons` | 券的規則，例如「新會員 100 元折價券：滿 990 折 100，領取後 30 天有效」 |
| 會員持有的券（`MemberCoupon`） | `member_coupons` | 某個會員「領到的一張」，有自己的到期時間和使用紀錄 |

回應裡的 `id` 都是**會員持有的券的 id**（`MemberCoupon.id`），結帳套用券時要傳這個。

**同一張券可以領很多次**：每領一次就多一筆，各自有到期時間。

**折價券類型：**

| `type` | 意思 | `value` 的意思 | 例子 |
|---|---|---|---|
| `AMOUNT` | 折固定金額 | 折多少元 | `value = 100` → 折 100 元 |
| `PERCENT` | 打折 | 折幾 % | `value = 10` → 折 10%，也就是打 9 折 |

> ⚠️ **目前是開發用的假登入**：「我的折價券」「結帳可選的券」操作的是「目前登入的會員」，而 `security/CurrentMember.java` **寫死會員 id = 1**，不會看前端帶的 token。

---

## 1. 我的折價券 `GET /api/coupon`

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  {
    "id": 3,
    "code": "SAVE10",
    "title": "全館 9 折券",
    "type": "PERCENT",
    "value": 10,
    "minSubtotal": 1490,
    "expireAt": "2026-10-17T14:30:00",
    "status": "usable"
  },
  {
    "id": 2,
    "code": "WELCOME100",
    "title": "新會員 100 元折價券",
    "type": "AMOUNT",
    "value": 100,
    "minSubtotal": 990,
    "expireAt": "2026-11-02T14:30:00",
    "status": "used"
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 會員持有的這張券的 id；結帳套用券時要傳回來 |
| `code` | string | 折扣碼 |
| `title` | string | 券名稱 |
| `type` | string | `AMOUNT`（折金額）/ `PERCENT`（打折） |
| `value` | number | `AMOUNT` → 折多少元；`PERCENT` → 折幾 % |
| `minSubtotal` | number | 最低消費（商品小計要 ≥ 這個數字才能用） |
| `expireAt` | string | 到期時間，格式 `yyyy-MM-ddTHH:mm:ss` |
| `status` | string | 狀態，見下表 |

`status` 的判斷順序：

| 順序 | 條件 | `status` |
|---|---|---|
| 1 | 已經用過（`used_at` 有值） | `used` |
| 2 | 沒用過，但到期時間已經過了 | `expired` |
| 3 | 其他 | `usable` |

> 注意大小寫：`type` 是**大寫**（`AMOUNT`），`status` 是**小寫**（`usable`）。
> 「用過又過期」的券，顯示 `used`（先判斷有沒有用過）。
> **包含已使用、已過期的券**，全部都會列出來。
> 順序是**到期時間由早到晚**，越快到期的越前面。
> 沒有任何券時，回空陣列 `[]`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 GET /api/coupon
   │
   ▼
① CouponService.getMyCoupons()
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 查這個會員持有的所有券，照到期時間由早到晚
   └─ 每一張轉成 CouponResponse
        └─ 依「用過沒 → 過期沒」算出 status
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`member_coupons`、`coupons` 表，不會寫入任何資料。

---

## 2. 結帳可選的券 `GET /api/coupon/usable`

結帳頁的「選擇折價券」清單，順便算好每張券這次能折多少。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `subtotal` | 網址 | number | ✅ | 購物車的商品小計（**不含運費**） |

範例：`GET /api/coupon/usable?subtotal=1200`

> `subtotal` 沒帶、或不是數字（例如 `subtotal=abc`）時，我**推測**會回 500 `系統發生錯誤，請稍後再試`：參數型別是 `int`，Spring 沒辦法把「沒有值」或文字轉成 `int`，丟出的例外 `GlobalExceptionHandler` 沒有專門處理。沒有實際測過。

### Response — 成功 `200 OK`

以 `subtotal=1200` 為例：

```json
[
  {
    "id": 3,
    "code": "SAVE10",
    "title": "全館 9 折券",
    "type": "PERCENT",
    "value": 10,
    "minSubtotal": 1490,
    "expireAt": "2026-10-17T14:30:00",
    "meetsMinSubtotal": false,
    "discount": 0
  },
  {
    "id": 2,
    "code": "WELCOME100",
    "title": "新會員 100 元折價券",
    "type": "AMOUNT",
    "value": 100,
    "minSubtotal": 990,
    "expireAt": "2026-11-02T14:30:00",
    "meetsMinSubtotal": true,
    "discount": 100
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` ~ `expireAt` | | 同「我的折價券」（但沒有 `status`） |
| `meetsMinSubtotal` | boolean | 這次的小計有沒有達到最低消費；`false` 時前端顯示但**不能選** |
| `discount` | number | 用這張券這次能折多少元；`meetsMinSubtotal` 是 `false` 時固定是 `0` |

> **只會列出「未使用」且「未過期」的券**。
> **沒達到最低消費的券也會列出來**，只是 `meetsMinSubtotal` 是 `false`，讓使用者知道「再買多少就能用」。
> 順序是**到期時間由早到晚**。

### 折扣怎麼算

| `type` | 公式 | 說明 |
|---|---|---|
| `AMOUNT` | `min(value, subtotal)` | 最多折到 0 元，不會變負的 |
| `PERCENT` | `subtotal × value ÷ 100` | **小數無條件捨去** |

手動推演：

| `subtotal` | 券 | 有沒有達到最低消費 | `discount` |
|---|---|---|---|
| 1200 | 滿 990 折 100（`AMOUNT`, 100） | 1200 ≥ 990 ✅ | min(100, 1200) = **100** |
| 1200 | 滿 1490 打 9 折（`PERCENT`, 10） | 1200 < 1490 ❌ | **0** |
| 1599 | 滿 1490 打 9 折（`PERCENT`, 10） | 1599 ≥ 1490 ✅ | 1599 × 10 ÷ 100 = 159.9 → **159** |

> 這裡算的 `discount` **只是給結帳頁顯示用**。真正下單時，結帳 API（`CheckoutService`）會用後端自己算的小計**重新算一次**，規則相同。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 GET /api/coupon/usable?subtotal=...
   │
   ▼
① CouponService.getUsableCoupons()
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 查這個會員持有的所有券，照到期時間由早到晚
   ├─ 只留下「沒用過」且「到期時間在現在之後」的
   └─ 每一張轉成 UsableCouponResponse
        ├─ meetsMinSubtotal = subtotal ≥ minSubtotal
        └─ 有達到 → 依 type 算 discount；沒達到 → discount = 0
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`member_coupons`、`coupons` 表，不會寫入任何資料。

---

## 3. 發券給會員 `POST /api/coupon`

把某張折價券發給某個會員。

### Request

```json
{
  "memberId": 1,
  "couponId": 2
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `memberId` | number | ✅ | 不可為 `null`；要發給哪個會員 |
| `couponId` | number | ✅ | 不可為 `null`；折價券**範本**的 id（`coupons.id`，不是 `member_coupons.id`） |

### Response — 成功 `204 No Content`

沒有 body。

> **重複發同一張券不會報錯**：每發一次就多一張，各自有到期時間。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`memberId: 不得是空值` |
| 400 | 其他欄位格式錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 401 | `memberId` 找不到會員 | `登入過期或失效` |
| 404 | `couponId` 找不到折價券 | `沒有找到這張折價券` |
| 400 | 這張折價券已停止發放（`is_active = 0`） | `這張折價券已停止發放` |

### 過程中做了什麼

```
前端 POST /api/coupon
   │
   ▼
① Spring 把 JSON 轉成 GrantCouponRequest
   └─ 轉不過去（JSON 語法錯）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400（一次列出所有錯的欄位）
   │
   ▼
③ CouponService.grantTo()   ← 整段包在 @Transactional 裡
   ├─ 用 memberId 查會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用 couponId 查折價券範本
   │    └─ 查不到 → 404「沒有找到這張折價券」
   ├─ 檢查範本是不是還在發放中（active）
   │    └─ 不是 → 400「這張折價券已停止發放」
   └─ 新增一筆 MemberCoupon
        └─ 到期時間 = 現在 + 範本的 valid_days 天
   │
   ▼
④ 回 204（沒有 body）
```

**資料庫影響：** `member_coupons` 表新增一筆。

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `member_id` | Request 的 `memberId` |
| `coupon_id` | Request 的 `couponId` |
| `expire_at` | 現在時間 + 範本的 `valid_days` 天 |
| `used_at` | `null`（未使用） |
| `order_id` | `null`（還沒用在任何訂單） |
| `received_at` | 寫入當下的時間 |

**到期時間的手動推演**：10/03 14:30 領「新會員 100 元折價券」（`valid_days = 30`）→ `expire_at` = 11/02 14:30。

> ⚠️ 觀察到的小地方（供參考）：
> - **任何人都能呼叫這支，發任何券給任何會員**，沒有檢查呼叫的人是不是管理員。如果這支只是開發測試用，上線前要加權限或拿掉。
> - `memberId` 找不到會員時，回的是 401「登入過期或失效」，但這裡的 `memberId` 是 Request 傳進來的，不是登入的人，用 404「找不到會員」比較貼切。
