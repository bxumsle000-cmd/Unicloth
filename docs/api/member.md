# Member API（會員資料 / 修改資料 / 修改密碼）

- Controller：`controller/MemberController.java`
- Service：`service/MemberService.java`
- 共同前綴：`/api/member`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 取得我的會員資料 | GET | `/api/member/me` | 200 | 會員資料 |
| 修改我的會員資料 | PUT | `/api/member/me/profile` | 200 | 修改後的會員資料 |
| 修改密碼 | PATCH | `/api/member/me/password` | 204 | 沒有 body |

> ⚠️ **目前是開發用的假登入**：這三支 API 都是透過 `security/CurrentMember.java` 取得「目前登入的會員」，而它**寫死會員 id = 1**，不會看前端帶的 token。所以不管誰呼叫，操作的都是 id = 1 的會員。資料庫裡沒有 id = 1 的會員時，會回 401。

---

## 1. 取得我的會員資料 `GET /api/member/me`

### Request

不需要 body。

### Response — 成功 `200 OK`

```json
{
  "memberId": 1,
  "email": "amy@example.com",
  "name": "王小美",
  "phone": "0912345678",
  "gender": "female",
  "birthday": "1998-05-20",
  "address": "台北市信義區市府路1號",
  "status": "ACTIVE",
  "createdAt": "2026-10-03T14:30:00"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `memberId` | number | 會員 id |
| `email` | string | Email |
| `name` | string | 姓名 |
| `phone` | string | 手機 |
| `gender` | string | 性別 |
| `birthday` | string | 生日，格式 `yyyy-MM-dd` |
| `address` | string \| null | 地址，沒填過就是 `null` |
| `status` | string | 帳號狀態：`ACTIVE`（正常）/ `DISABLED`（停用） |
| `createdAt` | string | 註冊時間，格式 `yyyy-MM-ddTHH:mm:ss`（可能帶小數秒，例如 `2026-10-03T14:30:00.123`） |

> 回應**不會**帶出密碼（`MemberResponse.from()` 沒有放 `passwordHash`）。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 GET /api/member/me
   │
   ▼
① MemberService.getMe()
   ├─ CurrentMember.require()：用目前登入的會員 id 去 members 表查
   │    └─ 查不到 → 401「登入過期或失效」
   └─ 把 Member 轉成 MemberResponse（拿掉密碼）
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 只有「讀」`members` 表，不會寫入任何資料。

---

## 2. 修改我的會員資料 `PUT /api/member/me/profile`

### Request

```json
{
  "name": "王小美",
  "phone": "0987654321",
  "address": "台中市西屯區台灣大道三段99號"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `name` | string | ✅ | 不可空白、最多 50 字 |
| `phone` | string | ✅ | 不可空白、最多 20 字（**目前沒檢查是不是數字或手機格式**） |
| `address` | string | ❌ | 可以不傳或傳 `null`；有傳的話最多 255 字 |

> ⚠️ **`address` 不傳 = 清空地址**：這支是 PUT，三個欄位都會直接覆蓋。`address` 沒傳或傳 `null`，資料庫裡原本的地址會被改成 `null`。前端如果只想改姓名，也要把原本的 `phone`、`address` 一起帶上。

> 只能改 `name`、`phone`、`address`。`email`、`gender`、`birthday` 就算放進 JSON 也會被忽略，不會報錯也不會修改。

### Response — 成功 `200 OK`

回傳**修改後**的會員資料，格式跟「取得我的會員資料」完全一樣。

```json
{
  "memberId": 1,
  "email": "amy@example.com",
  "name": "王小美",
  "phone": "0987654321",
  "gender": "female",
  "birthday": "1998-05-20",
  "address": "台中市西屯區台灣大道三段99號",
  "status": "ACTIVE",
  "createdAt": "2026-10-03T14:30:00"
}
```

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`name: 不得是空白; phone: 不得是空白` |
| 400 | 其他欄位格式錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 PUT /api/member/me/profile
   │
   ▼
① Spring 把 JSON 轉成 UpdateMemberRequest
   └─ 轉不過去（JSON 語法錯）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400（一次列出所有錯的欄位）
   │
   ▼
③ MemberService.updateProfile()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 把 name、phone、address 設成 Request 的值
   └─ 把 Member 轉成 MemberResponse
   │
   ▼
④ 交易結束，Hibernate 發現 Member 被改過 → 自動 UPDATE 回資料庫
   │
   ▼
⑤ 回 200 + JSON
```

**資料庫影響：** `members` 表更新一筆（目前登入的會員）。

| 欄位 | 值從哪來 |
|---|---|
| `name`、`phone`、`address` | Request 原封不動 |
| 其他欄位 | 不變 |

**補充：為什麼程式裡沒有呼叫 `save()` 也會存進資料庫？**
在 `@Transactional` 裡從資料庫查出來的 Entity，Hibernate 會一直「盯著」它。交易結束時，Hibernate 比對發現欄位被 `setXxx()` 改過，就會自動送出 UPDATE。這個機制叫 dirty checking。

---

## 3. 修改密碼 `PATCH /api/member/me/password`

### Request

```json
{
  "oldPassword": "12345678",
  "newPassword": "abcd1234"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `oldPassword` | string | ✅ | 不可空白 |
| `newPassword` | string | ✅ | 不可空白、**長度 8～72 字**（訊息：`密碼長度需為 8～72 字`） |

> 為什麼上限是 72？BCrypt 只會處理密碼的前 72 個 byte，超過的部分會被忽略，所以直接擋掉。
> （註冊的 `password` 目前只限制「最少 8 字」，沒有 72 的上限，兩邊規則不一致，供參考。）

### Response — 成功 `204 No Content`

沒有 body。前端只要看狀態碼是 204 就代表修改成功。

> 改完密碼**不會**登出，下次登入要用新密碼。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`newPassword: 密碼長度需為 8～72 字` |
| 400 | 其他欄位格式錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 400 | 舊密碼輸入錯誤 | `密碼錯誤` |
| 400 | 新密碼跟舊密碼一樣 | `新密碼不能與舊密碼相同` |
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 PATCH /api/member/me/password
   │
   ▼
① Spring 把 JSON 轉成 ChangePasswordRequest
   └─ 轉不過去（JSON 語法錯）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400（一次列出所有錯的欄位）
   │
   ▼
③ MemberService.changePassword()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 用 BCrypt 比對 oldPassword 和資料庫的 password_hash
   │    └─ 不符 → 400「密碼錯誤」
   ├─ 用 BCrypt 比對 newPassword 和資料庫的 password_hash
   │    └─ 相符（新舊一樣）→ 400「新密碼不能與舊密碼相同」
   └─ 用 BCrypt 把 newPassword 加密，設成新的 password_hash
   │
   ▼
④ 交易結束，Hibernate 自動 UPDATE 回資料庫（dirty checking）
   │
   ▼
⑤ 回 204（沒有 body）
```

**資料庫影響：** `members` 表更新一筆（目前登入的會員）。

| 欄位 | 值從哪來 |
|---|---|
| `password_hash` | Request 的 `newPassword` 經 BCrypt 加密 |
| 其他欄位 | 不變 |

> ⚠️ 觀察到的小地方（不影響目前功能，供參考）：這三支 API 都**沒有**檢查會員 `status`，所以被停用（`DISABLED`）的會員，目前仍然可以查詢、修改資料和改密碼。實際上停用的會員登不進來，所以現階段影響不大。
