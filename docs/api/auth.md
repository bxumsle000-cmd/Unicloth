# Auth API（登入 / 註冊 / 登出）

- Controller：`controller/AuthController.java`
- Service：`service/AuthService.java`
- 共同前綴：`/api/auth`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 登入 | POST | `/api/auth/login` | 200 | `{ memberId, token }` |
| 註冊 | POST | `/api/auth/register` | 204 | 沒有 body |
| 登出 | POST | `/api/auth/logout` | 204 | 沒有 body |

---

## 1. 登入 `POST /api/auth/login`

### Request

```json
{
  "email": "amy@example.com",
  "password": "12345678"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `email` | string | ✅ | 不可空白、要是 Email 格式 |
| `password` | string | ✅ | 不可空白 |

### Response — 成功 `200 OK`

```json
{
  "memberId": 1,
  "token": "DEV_CURRENT_TOKEN"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `memberId` | number | 登入會員的 id |
| `token` | string | 登入 token，之後呼叫需要登入的 API 時使用 |

> ⚠️ **目前是開發用的假 token**：不管誰登入，`token` 都固定回 `"DEV_CURRENT_TOKEN"`（來自 `security/CurrentMember.java`）。之後換成真正的登入機制（例如 JWT）時，這裡的格式可能會變。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `email` 或 `password` 沒填、email 格式錯 | 例：`email: 必須是格式正確的電子郵件地址` |
| 401 | 查不到這個 email | `帳號或密碼錯誤` |
| 401 | email 存在但密碼錯 | `帳號或密碼錯誤` |
| 403 | 帳號狀態不是 `ACTIVE`（被停用） | `此帳號已被停用` |

> 為什麼「email 不存在」和「密碼錯」回一樣的訊息？
> 故意的。如果分開講，壞人就能拿一堆 email 來試，知道哪些 email 有註冊過。

### 過程中做了什麼

```
前端 POST /api/auth/login
   │
   ▼
① Spring 把 JSON 轉成 LoginRequest
   └─ 轉不過去（JSON 語法錯）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400
   │
   ▼
③ AuthService.login()
   ├─ 用 email 去 members 表查會員（findByEmail）
   │    └─ 查不到 → 401「帳號或密碼錯誤」
   ├─ 用 BCrypt 比對：輸入的明碼 vs 資料庫裡的 password_hash
   │    └─ 不符 → 401「帳號或密碼錯誤」
   ├─ 檢查 status 是不是 ACTIVE
   │    └─ 不是 → 403「此帳號已被停用」
   └─ 全部通過 → 組出 LoginResponse(memberId, token)
   │
   ▼
④ 回 200 + JSON
```

**資料庫影響：** 只有「讀」`members` 表，不會寫入任何資料。

**補充：BCrypt 比對是怎麼回事？**
資料庫不存明碼密碼，只存 BCrypt 算出來的雜湊值（例如 `$2a$10$Xk...`）。登入時不是把雜湊「解回」明碼，而是用 `passwordEncoder.matches(明碼, 雜湊)` 判斷「這組明碼算出來是否對得上這個雜湊」。

---

## 2. 註冊 `POST /api/auth/register`

### Request

```json
{
  "email": "amy@example.com",
  "password": "12345678",
  "name": "王小美",
  "phone": "0912345678",
  "gender": "female",
  "birthday": "1998-05-20",
  "address": "台北市信義區市府路1號"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `email` | string | ✅ | 不可空白、Email 格式 |
| `password` | string | ✅ | 不可空白、**至少 8 字**（訊息：`密碼長度最少8字`） |
| `name` | string | ✅ | 不可空白、最多 50 字 |
| `phone` | string | ✅ | 不可空白、最多 20 字（**目前沒檢查是不是數字或手機格式**） |
| `gender` | string | ✅ | 不可空白（Entity 註解寫 `male` / `female`，但**目前後端沒擋其他值**） |
| `birthday` | string | ✅ | 格式 `yyyy-MM-dd`，必須是**過去的日期**（今天也不行） |
| `address` | string | ❌ | 可以不傳或傳 `null`；有傳的話最多 255 字 |

### Response — 成功 `204 No Content`

沒有 body。前端只要看狀態碼是 204 就代表註冊成功。

> 註冊成功**不會**自動登入，前端要再呼叫一次 `/api/auth/login`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`password: 密碼長度最少8字; name: 不得是空白` |
| 400 | 其他欄位格式錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 409 | email 已經被註冊過 | `此email已經註冊過` |

### 過程中做了什麼

```
前端 POST /api/auth/register
   │
   ▼
① Spring 把 JSON 轉成 RegisterRequest
   └─ 轉不過去（例如 birthday 格式錯）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400（一次列出所有錯的欄位）
   │
   ▼
③ AuthService.register()   ← 整段包在 @Transactional 裡
   ├─ 檢查 email 是否已存在（existsByEmail）
   │    └─ 已存在 → 409「此email已經註冊過」
   ├─ 用 BCrypt 把密碼加密成 password_hash
   ├─ 組出 Member 物件
   │    ├─ status 預設 ACTIVE
   │    └─ created_at 由 Hibernate 自動填現在時間
   └─ 存進 members 表（save）
   │
   ▼
④ 回 204（沒有 body）
```

**資料庫影響：** `members` 表新增一筆。

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `email`、`name`、`phone`、`gender`、`birthday`、`address` | Request 原封不動 |
| `password_hash` | Request 的 `password` 經 BCrypt 加密 |
| `status` | 固定 `ACTIVE` |
| `created_at` | 寫入當下的時間 |

---

## 3. 登出 `POST /api/auth/logout`

### Request

不需要 body。

### Response — 成功 `204 No Content`

沒有 body。

### 過程中做了什麼

**目前什麼都沒做**，方法是空的，呼叫一定回 204。
等之後接上真正的登入機制，才會在這裡做「讓 token 失效」之類的處理。前端現階段登出時，自己把手上存的 token 清掉即可。
