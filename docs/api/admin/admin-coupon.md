# Admin Coupon API（行銷後台：折價券管理）

- Controller：`controller/admin/AdminCouponController.java`
- Service：`service/admin/AdminCouponService.java`
- 共同前綴：`/api/admin/mkt/coupons`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 折價券列表 | GET | `/api/admin/mkt/coupons` | 200 | 所有折價券 |
| 新增折價券 | POST | `/api/admin/mkt/coupons` | 201 | 沒有 body |
| 編輯折價券 | PUT | `/api/admin/mkt/coupons/{id}` | 204 | 沒有 body |
| 啟用折價券 | PATCH | `/api/admin/mkt/coupons/{id}/enable` | 204 | 沒有 body |
| 停用折價券 | PATCH | `/api/admin/mkt/coupons/{id}/disable` | 204 | 沒有 body |
| 發券給會員 | POST | `/api/admin/mkt/coupons/{id}/grant` | 204 | 沒有 body |
| 預約發送紀錄 | GET | `/api/admin/mkt/coupons/schedules` | 200 | 預約紀錄（分頁） |
| 取消預約發送 | PATCH | `/api/admin/mkt/coupons/schedules/{scheduleId}/cancel` | 204 | 沒有 body |
| 發券紀錄 | GET | `/api/admin/mkt/coupons/records` | 200 | 發券紀錄（分頁） |

發券時選會員用的清單在 [admin-mkt-member.md](admin-mkt-member.md)。會員端看自己的券在 [coupon.md](../store/coupon.md)。

**這裡的 `{id}` 是折價券範本的 id**（`coupons.id`），不是會員持有的那張券。

**折價券類型：**

| `type` | 意思 | `value` 的意思 | 例子 |
|---|---|---|---|
| `AMOUNT` | 折固定金額 | 折多少元 | `value = 100` → 折 100 元 |
| `PERCENT` | 打折 | 折幾 % | `value = 10` → 折 10%，也就是打 9 折 |

> 🔒 **只有 MKT、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
>
> 下面各支 API 的「失敗」表格就不再重複列這兩種。

---

## 1. 折價券列表 `GET /api/admin/mkt/coupons`

### Request

不需要參數。**篩選都在前端做**（券的數量不多）。

### Response — 成功 `200 OK`

```json
[
  {
    "id": 6,
    "code": "VIP300",
    "title": "VIP 專屬禮",
    "type": "AMOUNT",
    "value": 300,
    "minSubtotal": 3000,
    "validDays": 30,
    "autoTrigger": null,
    "active": true,
    "issuedCount": 18
  }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 折價券 id；編輯、啟用、停用、發券都用它指定 |
| `code` | string | 折扣碼，建立後不能改 |
| `title` | string | 券名稱 |
| `type` | string | `AMOUNT` / `PERCENT` |
| `value` | number | `AMOUNT` → 折多少元；`PERCENT` → 折幾 % |
| `minSubtotal` | number | 最低消費 |
| `validDays` | number | 領取後幾天內有效 |
| `autoTrigger` | string \| null | 自動發送時機，目前只有 `BIRTHDAY`（生日禮）；`null` = 只能手動發 |
| `active` | boolean | 是否啟用；停用後不能再發，已發出的券會員還是能用 |
| `issuedCount` | number | 已經發出去幾張 |

> 順序是**新建的在前面**，包含停用的券。

### Response — 失敗

只有最上面列的共通錯誤。

### 過程中做了什麼

```
前端 GET /api/admin/mkt/coupons
   │
   ▼
① AdminCouponService.getAllCoupons()   ← 整段包在 @Transactional 裡
   ├─ 查出所有折價券，照 id 由大到小
   └─ 每一張轉成 AdminCouponResponse，issuedCount = 這張券的 member_coupons 筆數
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`coupons`、`member_coupons` 表，不會寫入任何資料。

---

## 2. 新增折價券 `POST /api/admin/mkt/coupons`

### Request

```json
{
  "code": "WELCOME100",
  "title": "新會員 100 元折價券",
  "type": "AMOUNT",
  "value": 100,
  "minSubtotal": 990,
  "validDays": 30,
  "autoTrigger": null
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `code` | string | ✅ | 不可空白（訊息：`請輸入折扣碼`）；前後空白去掉、轉大寫後不能重複；**建立後不能改** |
| `title` | string | ✅ | 不可空白（訊息：`請輸入名稱`）；前後空白會去掉 |
| `type` | string | ✅ | 不可空（訊息：`請選擇折扣方式`）；`AMOUNT` / `PERCENT` |
| `value` | number | ✅ | 不可空（訊息：`請輸入折扣`）；≥ 1（訊息：`折扣要大於 0`）；另外見下表 |
| `minSubtotal` | number | ✅ | 不可空（訊息：`請輸入最低消費`）；≥ 0（訊息：`最低消費不能是負的`） |
| `validDays` | number | ✅ | 不可空（訊息：`請輸入有效天數`）；≥ 1（訊息：`有效天數至少 1 天`） |
| `autoTrigger` | string | ❌ | `BIRTHDAY` 或不傳；不傳 = 只能手動發 |

**折扣規則（要同時看兩個欄位，在 Service 檢查）：**

| `type` | 規則 | 沒過的訊息 |
|---|---|---|
| `PERCENT` | `value` 要在 1～99 之間 | `打折的 % 要在 1～99 之間` |
| `AMOUNT` | `value` 要比 `minSubtotal` 小 | `折的金額要比最低消費小` |

> 新增的券預設是**啟用**，不用傳。
> `code`、`title` 資料庫上限是 30、100 字，**新增時後端沒有先檢查長度**；超過的話會在寫進資料庫時出錯。

### Response — 成功 `201 Created`

沒有 body。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`type: 請選擇折扣方式; value: 請輸入折扣; code: 請輸入折扣碼` |
| 400 | `type`、`autoTrigger` 不是上面列的值 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 折扣規則沒過 | `打折的 % 要在 1～99 之間` 或 `折的金額要比最低消費小` |
| 409 | 折扣碼已經有了（`welcome100` 和 `WELCOME100` 算同一個） | `這個折扣碼已經有了` |

### 過程中做了什麼

```
前端 POST /api/admin/mkt/coupons
   │
   ▼
① Spring 把 JSON 轉成 CreateCouponRequest，@Valid 檢查欄位
   └─ 沒過 → 400
   │
   ▼
② AdminCouponService.createCoupon()   ← 整段包在 @Transactional 裡
   ├─ code 去掉前後空白、轉大寫
   ├─ 折扣碼已存在 → 409「這個折扣碼已經有了」
   ├─ 檢查折扣規則 → 沒過 → 400
   └─ 存一筆 Coupon
   │
   ▼
③ 回 201（沒有 body）
```

**資料庫影響：** `coupons` 表新增一筆。

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `code` | Request 的 `code` 轉大寫 |
| `title`、`type`、`value`、`min_subtotal`、`valid_days`、`auto_trigger` | Request |
| `is_active` | 固定啟用 |
| `created_at` | 寫入當下的時間 |

---

## 3. 編輯折價券 `PUT /api/admin/mkt/coupons/{id}`

整張表單一起送，折扣碼不能改，啟用 / 停用另外一支。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `id` | 路徑 | number | ✅ | 折價券 id |

```json
{
  "title": "新會員 150 元折價券",
  "type": "AMOUNT",
  "value": 150,
  "minSubtotal": 990,
  "validDays": 30,
  "autoTrigger": null
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `title` | string | ✅ | 不可空白（訊息：`請輸入名稱`）；最多 100 字（訊息：`名稱最多 100 個字`） |
| `type`、`value`、`minSubtotal`、`validDays` | | ✅ | 同「新增折價券」，折扣規則也一樣 |
| `autoTrigger` | string | ❌ | **不傳 = 改成只能手動發**，原本的設定會被清掉 |

> **已發出、還沒用的券也會跟著變**：會員持有的券是看範本的折扣內容（類型、面額、最低消費、名稱）。
> `validDays` 只影響**之後發的券**，已發出的券到期時間不變。

### Response — 成功 `204 No Content`

沒有 body。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`validDays: 有效天數至少 1 天; title: 名稱最多 100 個字` |
| 400 | `type`、`autoTrigger` 不是可用的值 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 折扣規則沒過 | `打折的 % 要在 1～99 之間` 或 `折的金額要比最低消費小` |
| 404 | 找不到這張券 | `沒有找到這張折價券` |

### 過程中做了什麼

```
前端 PUT /api/admin/mkt/coupons/{id}
   │
   ▼
① Spring 把 JSON 轉成 UpdateCouponRequest，@Valid 檢查欄位
   └─ 沒過 → 400
   │
   ▼
② AdminCouponService.editCoupon()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查券 → 查不到 → 404「沒有找到這張折價券」
   ├─ 檢查折扣規則 → 沒過 → 400
   └─ 把欄位設成 Request 的值（交易結束時自動 UPDATE）
   │
   ▼
③ 回 204（沒有 body）
```

**資料庫影響：** `coupons` 表更新一筆的 `title`、`type`、`value`、`min_subtotal`、`valid_days`、`auto_trigger`。

---

## 4. 啟用 / 停用折價券

- `PATCH /api/admin/mkt/coupons/{id}/enable`
- `PATCH /api/admin/mkt/coupons/{id}/disable`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `id` | 路徑 | number | ✅ | 折價券 id |

不需要 body。

### Response — 成功 `204 No Content`

沒有 body。

> 本來就是這個狀態再呼叫一次，一樣回 204。
> **停用後**：不能再手動發、生日禮不會再發、到時間的預約會變成 `FAILED`；已發出的券會員還是能用。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到這張券 | `沒有找到這張折價券` |

### 過程中做了什麼

```
前端 PATCH /api/admin/mkt/coupons/{id}/enable（或 disable）
   │
   ▼
① AdminCouponService.changeActive()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查券 → 查不到 → 404「沒有找到這張折價券」
   └─ 設定 active
   │
   ▼
② 回 204（沒有 body）
```

**資料庫影響：** `coupons` 表更新一筆的 `is_active`。

---

## 5. 發券給會員 `POST /api/admin/mkt/coupons/{id}/grant`

可以發給全部會員或指定會員，可以立即發或預約。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `id` | 路徑 | number | ✅ | 折價券 id |

```json
{
  "targetAll": false,
  "memberIds": [1, 2, 3],
  "scheduledAt": "2026-11-11T10:00:00"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `targetAll` | boolean | ✅ | `true` = 全部會員（只發給 `ACTIVE` 的）；`false` = 指定會員。**一定要傳**，沒傳回 400 |
| `memberIds` | number[] | `targetAll` 是 `false` 時 ✅ | 要發給哪些會員，至少一位；重複的 id 會自動去掉。`targetAll` 是 `true` 時不看這個欄位 |
| `scheduledAt` | string | ❌ | 不傳或 `null` = 立即發送；有值 = 預約，格式 `yyyy-MM-ddTHH:mm:ss`，要晚於現在 |

**四種組合：**

| `targetAll` | `scheduledAt` | 結果 |
|---|---|---|
| `true` | 沒有 | 現在發給目前所有 `ACTIVE` 會員 |
| `false` | 沒有 | 現在發給 `memberIds` |
| `true` | 有 | 預約；**以發送當下的會員為準** |
| `false` | 有 | 預約；發送時已停用的會員會跳過 |

### Response — 成功 `204 No Content`

沒有 body。

> **重複發不會報錯**：同一位會員可以拿到很多張同樣的券，每張各自有到期時間。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `targetAll` 沒傳、`scheduledAt` 格式不對、JSON 語法錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 這張券已停用 | `這張折價券已停止發放` |
| 400 | 指定會員但 `memberIds` 沒傳或是空的 | `請選擇要發給哪些會員` |
| 400 | `memberIds` 裡有會員不存在或已停用 | `有會員不存在或已停用` |
| 400 | `scheduledAt` 不晚於現在 | `預約時間要晚於現在` |
| 403 | 預約時，呼叫的員工帳號已被停用 | `此帳號已被停用` |
| 404 | 找不到這張券 | `沒有找到這張折價券` |

### 過程中做了什麼

```
前端 POST /api/admin/mkt/coupons/{id}/grant
   │
   ▼
① Spring 把 JSON 轉成 GrantCouponRequest
   └─ 轉不過去（targetAll 沒傳、日期格式錯）→ 400
   │
   ▼
② AdminCouponService.grantTo()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查券 → 查不到 → 404「沒有找到這張折價券」
   ├─ 券已停用 → 400「這張折價券已停止發放」
   ├─ 指定會員時：
   │    ├─ memberIds 是空的 → 400「請選擇要發給哪些會員」
   │    └─ 去掉重複，查出 ACTIVE 的會員；筆數對不上 → 400「有會員不存在或已停用」
   ├─ scheduledAt 是 null（立即發送）：
   │    ├─ 全部會員 → 查出所有 ACTIVE 會員
   │    └─ 每位各新增一筆 MemberCoupon
   └─ scheduledAt 有值（預約）：
        ├─ 不晚於現在 → 400「預約時間要晚於現在」
        ├─ CurrentStaff.require()：查出目前的員工 → 被停用 → 403
        └─ 存一筆 CouponSchedule
   │
   ▼
③ 回 204（沒有 body）
```

**資料庫影響：**

| 情況 | 表 | 動作 |
|---|---|---|
| 立即發送 | `member_coupons` | 每位會員新增一筆 |
| 預約 | `coupon_schedules` | 新增一筆 |
| 預約 + 指定會員 | `coupon_schedule_members` | 每位會員新增一筆 |

`member_coupons` 每一筆：

| 欄位 | 值從哪來 |
|---|---|
| `member_id` | 這位會員 |
| `coupon_id` | 網址的 `id` |
| `expire_at` | 現在時間 + 券的 `valid_days` 天 |
| `source` | `MANUAL`（手動發券） |
| `used_at`、`order_id` | `null` |
| `received_at` | 寫入當下的時間 |

**補充：預約什麼時候發？**
`CouponSendScheduler` 每分鐘找一次「等待中、時間到了」的預約，發完狀態改成 `SENT`，記下 `sent_at`、`sent_count`。到時間時券已停用的話不發，狀態改成 `FAILED`。

**補充：生日禮不用呼叫這支。**
`autoTrigger` 設成 `BIRTHDAY` 而且啟用中的券，`BirthdayCouponScheduler` 會自動發給當月壽星，同一個月同一張券不會重複發，`source` 是 `BIRTHDAY`。

---

## 6. 預約發送紀錄 `GET /api/admin/mkt/coupons/schedules`

包含已發送、已取消的。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `status` | 網址 | string | ❌ | `PENDING` / `SENT` / `FAILED` / `CANCELLED`；不帶就是全部 |
| `page` | 網址 | number | ❌ | 第幾頁，**從 0 開始**；預設 `0` |
| `size` | 網址 | number | ❌ | 一頁幾筆；預設 `10` |
| `sort` | 網址 | string | ❌ | 排序；預設 `scheduledAt,desc`（預約時間晚的在前面） |

範例：`GET /api/admin/mkt/coupons/schedules?status=PENDING&page=0&size=10`

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "id": 10,
      "couponCode": "VIP300",
      "couponTitle": "VIP 專屬禮",
      "targetAll": false,
      "memberCount": 3,
      "scheduledAt": "2026-11-02T10:00:00",
      "status": "SENT",
      "sentAt": "2026-11-02T15:11:27",
      "sentCount": 3,
      "createdByName": "行銷測試員"
    }
  ],
  "page": {
    "size": 10,
    "number": 0,
    "totalElements": 10,
    "totalPages": 1
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 預約 id；取消預約用它指定 |
| `couponCode` | string | 要發的券的折扣碼 |
| `couponTitle` | string | 要發的券的名稱 |
| `targetAll` | boolean | `true` = 全部會員 |
| `memberCount` | number | 指定會員時選了幾位；全部會員時是 `0` |
| `scheduledAt` | string | 預約時間 |
| `status` | string | 狀態，見下表 |
| `sentAt` | string \| null | 實際發出的時間；還沒發是 `null` |
| `sentCount` | number \| null | 實際發了幾位；還沒發是 `null` |
| `createdByName` | string | 建立預約的員工姓名 |

| `status` | 中文 | 意思 |
|---|---|---|
| `PENDING` | 等待中 | 時間還沒到 |
| `SENT` | 已發送 | 已經發出去 |
| `FAILED` | 未發送 | 時間到時券已停用 |
| `CANCELLED` | 已取消 | 手動取消 |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 500 | `status` 不是上面列的值、`sort` 用了不存在的欄位 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/mkt/coupons/schedules?...
   │
   ▼
① AdminCouponService.getSchedules()   ← @Transactional(readOnly = true)
   ├─ 依 status 查 coupon_schedules，分頁排序（status 是 null 就查全部）
   └─ 每一筆轉成 CouponScheduleResponse
   │
   ▼
② 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`coupon_schedules`、`coupon_schedule_members`、`coupons`、`staff` 表，不會寫入任何資料。

---

## 7. 取消預約發送 `PATCH /api/admin/mkt/coupons/schedules/{scheduleId}/cancel`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `scheduleId` | 路徑 | number | ✅ | 預約 id |

不需要 body。

### Response — 成功 `204 No Content`

沒有 body。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 這筆不是等待中 | `只有等待中的預約能取消，這筆是「{狀態中文}」`，例：`只有等待中的預約能取消，這筆是「已發送」` |
| 404 | 找不到這筆預約 | `沒有找到這筆預約` |

### 過程中做了什麼

```
前端 PATCH /api/admin/mkt/coupons/schedules/{scheduleId}/cancel
   │
   ▼
① AdminCouponService.cancelSchedule()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查預約 → 查不到 → 404「沒有找到這筆預約」
   ├─ 不是 PENDING → 400「只有等待中的預約能取消…」
   └─ status 設成 CANCELLED
   │
   ▼
② 回 204（沒有 body）
```

**資料庫影響：** `coupon_schedules` 表更新一筆的 `status`。

---

## 8. 發券紀錄 `GET /api/admin/mkt/coupons/records`

每張發出去的券一筆，手動發的和自動發的都有。

### Request

全部都是選填，沒帶就是不篩。

| 參數 | 位置 | 型別 | 說明 |
|---|---|---|---|
| `keyword` | 網址 | string | 會員姓名或 Email「包含」這段文字就算，不分大小寫；空白等於沒帶 |
| `couponId` | 網址 | number | 折價券 id |
| `source` | 網址 | string | `MANUAL`（手動發券）/ `BIRTHDAY`（生日禮） |
| `status` | 網址 | string | `USABLE`（可使用）/ `USED`（已使用）/ `EXPIRED`（已過期） |
| `receivedFrom` | 網址 | string | 發券日期起，格式 `2026-10-01`，含當天 |
| `receivedTo` | 網址 | string | 發券日期迄，格式 `2026-10-31`，含當天 |
| `page` | 網址 | number | 第幾頁，**從 0 開始**；預設 `0` |
| `size` | 網址 | number | 一頁幾筆；預設 `10` |

> 排序寫死是**發券時間新的在前面**，傳 `sort` 也沒有作用。

範例：`GET /api/admin/mkt/coupons/records?keyword=demo&status=USED&receivedFrom=2026-10-01&receivedTo=2026-10-31`

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "id": 233,
      "receivedAt": "2026-10-21T20:13:36",
      "memberName": "李佳穎",
      "memberEmail": "demo05@demo.unicloth.com",
      "couponCode": "SAVE10",
      "couponTitle": "全館 9 折券",
      "source": "MANUAL",
      "expireAt": "2026-11-04T20:13:36",
      "status": "USED",
      "usedAt": "2026-10-25T20:13:36",
      "orderNo": "UC20261025-4613",
      "orderDiscount": 614
    }
  ],
  "page": {
    "size": 10,
    "number": 0,
    "totalElements": 170,
    "totalPages": 17
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 會員持有這張券的 id（`member_coupons.id`） |
| `receivedAt` | string | 發券時間 |
| `memberName` | string \| null | 會員姓名；還沒補填資料是 `null` |
| `memberEmail` | string | 會員 Email |
| `couponCode` | string | 折扣碼 |
| `couponTitle` | string | 券名稱 |
| `source` | string | 這張券怎麼來的：`MANUAL` / `BIRTHDAY` |
| `expireAt` | string | 到期時間 |
| `status` | string | `USABLE` / `USED` / `EXPIRED`（**大寫**，跟會員端的小寫不一樣） |
| `usedAt` | string \| null | 使用時間；還沒用是 `null` |
| `orderNo` | string \| null | 用在哪張訂單；還沒用是 `null` |
| `orderDiscount` | number \| null | 那張訂單折了多少元；還沒用是 `null` |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `receivedFrom` 晚於 `receivedTo` | `開始日期不能晚於結束日期` |
| 500 | 日期格式不對、`source`、`status` 不是上面列的值、`couponId` 不是數字 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/mkt/coupons/records?...
   │
   ▼
① AdminCouponService.getRecords()   ← @Transactional(readOnly = true)
   ├─ receivedFrom 晚於 receivedTo → 400
   ├─ keyword 轉小寫、前後加 %（空白就不篩）
   ├─ 日期換成時間：receivedTo 要含當天，所以查到隔天 00:00 之前
   └─ 一條查詢做完：會員、券、姓名、訂單一起接，依條件篩選、分頁
        每一筆的 status 由 usedAt、expireAt 算出來
   │
   ▼
② 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`member_coupons`、`members`、`member_profiles`、`coupons`、`orders` 表，不會寫入任何資料。
