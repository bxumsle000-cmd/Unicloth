# Staff API（後台員工帳號管理）

- Controller：`controller/StaffController.java`
- Service：`service/StaffService.java`
- 共同前綴：`/api/admin/admin/staff`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 員工列表 | GET | `/api/admin/admin/staff` | 200 | 分頁的員工清單 |
| 新增員工 | POST | `/api/admin/admin/staff` | 201 | `{ tempPassword }` |
| 改員工姓名 | PATCH | `/api/admin/admin/staff/{account}/name` | 204 | 沒有 body |
| 重設密碼 | POST | `/api/admin/admin/staff/{account}/reset-password` | 200 | `{ tempPassword }` |
| 停用帳號 | PATCH | `/api/admin/admin/staff/{account}/disable` | 204 | 沒有 body |
| 啟用帳號 | PATCH | `/api/admin/admin/staff/{account}/enable` | 204 | 沒有 body |

**`{account}` 是什麼？** 員工的登入帳號，例如 `product01`。帳號建立後不能改，所以拿它當指定員工的依據。

**部門和狀態的值：**

| 欄位 | 可能的值 |
|---|---|
| `department` | `PRODUCT`（商品部）、`ORDER`（訂單物流）、`CS`（客服）、`MKT`（行銷）、`ADMIN`（管理者） |
| `status` | `ACTIVE`（正常）、`DISABLED`（停用） |

> 🔒 **只有 ADMIN（管理者）能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 `admin-auth.md`），而且 token 裡的部門要是 `ADMIN`。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
>
> 下面各支 API 的「失敗」表格就不再重複列這兩種。

> ⚠️ **目前的限制**：這幾支 API 只檢查 token 裡的部門，**沒有再查資料庫**確認呼叫的管理者是不是還在啟用中。
> 管理者被停用後，舊 token 在過期前（1 天）還是能用這些 API。只有「停用」會用到目前登入者的 id（擋停用自己），也只查 id、不查狀態。
> 改自己的密碼（`/api/admin/auth/password`）有查，被停用會回 403。

**員工自己改密碼不在這裡**，在 `PATCH /api/admin/auth/password`（見 `admin-auth.md`）。

---

## 1. 員工列表 `GET /api/admin/admin/staff`

### Request

全部都是選填的網址參數，沒帶就是不篩。

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `keyword` | 網址參數 | string | ❌ | 帳號**或**姓名「包含」這段文字就算，不分大小寫；前後空白會去掉 |
| `department` | 網址參數 | string | ❌ | 部門，完全相等 |
| `status` | 網址參數 | string | ❌ | 狀態，完全相等 |
| `page` | 網址參數 | number | ❌ | 第幾頁，**從 0 開始**；預設 `0` |
| `size` | 網址參數 | number | ❌ | 一頁幾筆；預設 `20` |
| `sort` | 網址參數 | string | ❌ | 排序，格式 `欄位,asc` 或 `欄位,desc`，例：`account,desc`；預設 `id,asc`（建立順序） |

範例：`GET /api/admin/admin/staff?keyword=測試&department=PRODUCT&status=ACTIVE&page=0&size=20`

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "account": "product01",
      "name": "商品部測試員",
      "department": "PRODUCT",
      "status": "ACTIVE",
      "lastLoginAt": "2026-10-19T14:46:34"
    },
    {
      "account": "order01",
      "name": "訂單物流測試員",
      "department": "ORDER",
      "status": "ACTIVE",
      "lastLoginAt": null
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 2,
    "totalPages": 1
  }
}
```

`content` 每一筆：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `account` | string | 登入帳號 |
| `name` | string | 姓名 |
| `department` | string | 所屬部門 |
| `status` | string | 帳號狀態 |
| `lastLoginAt` | string \| null | 最後登入時間，格式 `yyyy-MM-ddTHH:mm:ss`；**還沒登入過是 `null`** |

`page`：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `size` | number | 一頁幾筆 |
| `number` | number | 目前第幾頁（從 0 開始） |
| `totalElements` | number | 符合條件的總筆數 |
| `totalPages` | number | 總頁數 |

> 不會回 `id`、密碼雜湊、建立時間。
> 沒有符合的員工時，`content` 是空陣列 `[]`，`totalPages` 是 `0`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `department` 或 `status` 不是上面列的值 | Spring 的轉換錯誤訊息，例：`department: Failed to convert value of type 'java.lang.String' to required type '...Department'; ...` |

> 這個 400 的訊息是英文、還帶 Java 類別名稱，不適合直接給使用者看。前端用下拉選單送固定值就不會遇到。

### 過程中做了什麼

```
前端 GET /api/admin/admin/staff?...
   │
   ▼
① Spring 把網址參數轉成 StaffFilterRequest、Pageable
   └─ department / status 轉不過去 → 400
   │
   ▼
② StaffService.getStaff()
   ├─ keyword 是 null 就換成空字串 ""，有值就去掉前後空白
   └─ StaffRepository.findByFilter()：一次查出這一頁，直接轉成 StaffResponse
        ├─ keyword：LOWER(account) 或 LOWER(name) LIKE '%keyword%'
        ├─ department、status：沒帶（null）就不篩
        └─ 依 sort 排序、依 page / size 分頁，另外再算一次總筆數
   │
   ▼
③ 回 200 + JSON
```

**資料庫影響：** 只有「讀」`staff` 表，不會寫入任何資料。

**補充：keyword 為什麼不傳 `null` 而是傳 `""`？**
Hibernate 第一次遇到 `null` 參數時會猜它的型別並快取起來，之後再傳中文關鍵字就查不到。
傳空字串時 `LIKE '%%'` 會比對到全部，效果跟不篩一樣，也不會踩到這個問題。

---

## 2. 新增員工 `POST /api/admin/admin/staff`

### Request

```json
{
  "account": "cs02",
  "name": "王小明",
  "department": "CS"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `account` | string | ✅ | 不可空白（訊息：`請輸入帳號`）；不能跟別人重複；**建立後不能改** |
| `name` | string | ✅ | 不可空白（訊息：`請輸入姓名`） |
| `department` | string | ✅ | 不可空（訊息：`請選擇部門`）；**一個員工只能有一個部門** |

> **不用傳密碼**：密碼由系統產生，見下面的 `tempPassword`。
> `account`、`name` 資料庫欄位上限是 50 字，但**後端目前沒有先檢查長度**；超過的話會在寫進資料庫時出錯，實際回什麼我沒有測過。
> `account` 的前後空白**不會**去掉，`" cs02"` 和 `"cs02"` 會被當成不同帳號。

### Response — 成功 `201 Created`

```json
{
  "tempPassword": "kP7wRm3XtQaZ9nHc2vLb"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `tempPassword` | string | 系統產生的臨時密碼明碼，**只有這一次會回傳**，之後查不到；管理者要複製交給員工 |

> 新員工的 `status` 是 `ACTIVE`，`lastLoginAt` 是 `null`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`account: 請輸入帳號; name: 請輸入姓名; department: 請選擇部門` |
| 400 | `department` 不是上面列的值 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 409 | 帳號已經有人用 | `帳號代碼不能重複` |

### 過程中做了什麼

```
前端 POST /api/admin/admin/staff
   │
   ▼
① Spring 把 JSON 轉成 CreateNewStaffRequest，@Valid 檢查欄位
   └─ 沒過 → 400
   │
   ▼
② StaffService.createNewStaff()   ← 整段包在 @Transactional 裡
   ├─ 檢查帳號是否已存在（existsByAccount）
   │    └─ 已存在 → 409「帳號代碼不能重複」
   ├─ 產生 20 碼亂數臨時密碼
   ├─ 用 BCrypt 把臨時密碼加密成 password_hash
   └─ 存一筆 Staff 進 staff 表
   │
   ▼
③ 回 201 + { tempPassword }
```

**資料庫影響：** `staff` 表新增一筆。

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `account`、`name`、`department` | Request 原封不動 |
| `password_hash` | 臨時密碼經 BCrypt 加密 |
| `status` | 固定 `ACTIVE` |
| `last_login_at` | `null` |
| `created_at` | 寫入當下的時間 |

**補充：臨時密碼長什麼樣？**
20 個字元，從英文大小寫和數字裡隨機挑，但**拿掉了容易看錯的 `0` / `O`、`1` / `l` / `I`**，方便員工照著打。
用的是 `SecureRandom`（密碼學等級的亂數），不是一般的 `Random`，比較難被猜出來。

---

## 3. 改員工姓名 `PATCH /api/admin/admin/staff/{account}/name`

只能改姓名；帳號不能改，部門目前也沒有 API 可以改。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `account` | 路徑 | string | ✅ | 要改的員工帳號 |

```json
{
  "name": "王大明"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `name` | string | ✅ | 不可空白；前後空白會去掉再存。資料庫上限 50 字，**後端目前沒有先檢查長度** |

範例：`PATCH /api/admin/admin/staff/cs02/name`

### Response — 成功 `204 No Content`

沒有 body。

> 可以改自己的姓名，後端沒擋（後台畫面上自己那一列沒有放編輯按鈕）。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `name` 沒填或全是空白 | `name: 不得空白` |
| 404 | 找不到這個帳號 | `找不到此員工帳號` |

### 過程中做了什麼

```
前端 PATCH /api/admin/admin/staff/{account}/name
   │
   ▼
① @Valid 檢查 ChangeStaffNameRequest
   └─ 沒過 → 400
   │
   ▼
② StaffService.changeName()   ← 整段包在 @Transactional 裡
   ├─ 用 account 查員工（findByAccount）
   │    └─ 查不到 → 404「找不到此員工帳號」
   └─ 把 name 去掉前後空白後設回去（交易結束時自動 UPDATE，不用呼叫 save）
   │
   ▼
③ 回 204（沒有 body）
```

**資料庫影響：** 更新 `staff` 表那筆員工的 `name`。

---

## 4. 重設密碼 `POST /api/admin/admin/staff/{account}/reset-password`

員工忘記密碼時，由管理者重設成一組新的臨時密碼。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `account` | 路徑 | string | ✅ | 要重設的員工帳號 |

不需要 body。

範例：`POST /api/admin/admin/staff/cs02/reset-password`

### Response — 成功 `200 OK`

```json
{
  "tempPassword": "Yd4hTq8ZbNe2WkRm6PsA"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `tempPassword` | string | 新的臨時密碼明碼，**只有這一次會回傳**；格式跟新增員工一樣 |

> 重設後舊密碼**立刻**不能用。
> 已停用的帳號也能重設，但重設不會順便啟用，還是不能登入。
> 員工拿到臨時密碼登入後，建議用 `PATCH /api/admin/auth/password` 改成自己的密碼（目前沒有強制）。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到這個帳號 | `找不到此員工帳號` |

### 過程中做了什麼

```
前端 POST /api/admin/admin/staff/{account}/reset-password
   │
   ▼
① StaffService.resetPassword()   ← 整段包在 @Transactional 裡
   ├─ 用 account 查員工
   │    └─ 查不到 → 404「找不到此員工帳號」
   ├─ 產生 20 碼亂數臨時密碼
   └─ BCrypt 加密後存回 password_hash
   │
   ▼
② 回 200 + { tempPassword }
```

**資料庫影響：** 更新 `staff` 表那筆員工的 `password_hash`。

---

## 5. 停用帳號 `PATCH /api/admin/admin/staff/{account}/disable`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `account` | 路徑 | string | ✅ | 要停用的員工帳號 |

不需要 body。

範例：`PATCH /api/admin/admin/staff/cs02/disable`

### Response — 成功 `204 No Content`

沒有 body。

> 本來就是停用的帳號再停用一次，一樣回 204。
> 停用後：
> - 不能登入（帳號密碼對時回 403「此帳號已被停用」）
> - 還沒過期的舊 token 打 `PATCH /api/admin/auth/password` 會回 403
> - 但打其他後台 API **目前不會被擋**，見最上面的「目前的限制」

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 想停用自己 | `不能停用自己的帳號` |
| 404 | 找不到這個帳號 | `找不到此員工帳號` |

### 過程中做了什麼

```
前端 PATCH /api/admin/admin/staff/{account}/disable
   │
   ▼
① StaffService.disable()   ← 整段包在 @Transactional 裡
   ├─ 用 account 查員工
   │    └─ 查不到 → 404「找不到此員工帳號」
   ├─ 跟目前登入者的 id 比對（CurrentStaff.getCurrentId()）
   │    └─ 是自己 → 400「不能停用自己的帳號」
   └─ status 設成 DISABLED
   │
   ▼
② 回 204（沒有 body）
```

**資料庫影響：** 更新 `staff` 表那筆員工的 `status`。

**補充：為什麼不能停用自己？**
呼叫的人一定是還能用的 ADMIN，又不能停用自己，所以至少會留下一個 ADMIN，不會發生「管理者全被停用、沒人能進系統管理」。

---

## 6. 啟用帳號 `PATCH /api/admin/admin/staff/{account}/enable`

把停用的帳號重新啟用。

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `account` | 路徑 | string | ✅ | 要啟用的員工帳號 |

不需要 body。

範例：`PATCH /api/admin/admin/staff/cs02/enable`

### Response — 成功 `204 No Content`

沒有 body。

> 本來就是啟用中的帳號再啟用一次，一樣回 204。
> 啟用後用**原本的密碼**就能登入，密碼不會被重設。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到這個帳號 | `找不到此員工帳號` |

### 過程中做了什麼

```
前端 PATCH /api/admin/admin/staff/{account}/enable
   │
   ▼
① StaffService.enable()   ← 整段包在 @Transactional 裡
   ├─ 用 account 查員工
   │    └─ 查不到 → 404「找不到此員工帳號」
   └─ status 設成 ACTIVE
   │
   ▼
② 回 204（沒有 body）
```

**資料庫影響：** 更新 `staff` 表那筆員工的 `status`。
