# Admin Auth API（員工登入 / 改自己的密碼）

- Controller：`controller/AdminAuthController.java`
- Service：`service/AdminAuthService.java`
- 共同前綴：`/api/admin/auth`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 員工登入 | POST | `/api/admin/auth/login` | 200 | `{ staffId, token, name, department, account }` |
| 改自己的密碼 | PATCH | `/api/admin/auth/password` | 204 | 沒有 body |

**跟會員的 `/api/auth` 完全分開**：員工存在 `staff` 表，會員存在 `members` 表，兩邊的 token 也不能互用。
員工 token 打會員 API、會員 token 打後台 API，都回 403「沒有權限使用這個功能」。

**權限只看部門**：員工 token 裡多帶了所屬部門（`dept`），後台 API 依路徑擋：

| 路徑 | 誰能用 |
|---|---|
| `/api/admin/product/**` | `PRODUCT`、`ADMIN` |
| `/api/admin/order/**` | `ORDER`、`ADMIN` |
| `/api/admin/cs/**` | `CS`、`ADMIN` |
| `/api/admin/mkt/**` | `MKT`、`ADMIN` |
| `/api/admin/admin/**` | 只有 `ADMIN` |
| 其他 `/api/admin/**`（例如本檔的改密碼） | 所有員工 |

> 前端的員工 token 存在 localStorage 的 `adminToken`，跟會員的 `token` 分開。後台頁面呼叫 API 用 `admin.js` 的 `adminApi()`，會自動帶員工 token。

---

## 1. 員工登入 `POST /api/admin/auth/login`

不用登入就能呼叫。

### Request

```json
{
  "account": "product01",
  "password": "Test1234",
  "department": "PRODUCT"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `account` | string | ✅ | 不可空白 |
| `password` | string | ✅ | 不可空白 |
| `department` | string | ✅ | 登入頁選的部門：`PRODUCT` / `ORDER` / `CS` / `MKT` / `ADMIN`（要大寫） |

### Response — 成功 `200 OK`

```json
{
  "staffId": 2,
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyIiwiZGVwdCI6IlBST0RVQ1QiLC...",
  "name": "商品部測試員",
  "department": "PRODUCT",
  "account": "product01"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `staffId` | number | 員工 id |
| `token` | string | 員工 JWT，有效 1 天。之後呼叫後台 API 時，放在 header：`Authorization: Bearer <token>` |
| `name` | string | 員工姓名，畫面右上角顯示用 |
| `department` | string | **登入頁選的部門**，前端用來決定進哪個部門的頁面（例如 `PRODUCT` → `/admin/product`） |
| `account` | string | 登入帳號，例如 `product01` |

> **ADMIN（管理者）例外**：選哪個部門都能登入。例如 `sys01` 選 `PRODUCT` 登入，回傳的 `department` 是 `PRODUCT`（前端進商品部頁面），
> 但 token 裡的部門還是 `ADMIN`，所以所有部門的 API 都能用。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位沒填 | 例：`department: 不得是空值; account: 不得空白; password: 不得空白` |
| 400 | `department` 不是上面五個值之一（例如小寫 `product`） | `請求內容格式錯誤，請確認欄位值是否正確` |
| 401 | 查不到這個帳號 | `帳號或密碼錯誤` |
| 401 | 帳號存在但密碼錯 | `帳號或密碼錯誤` |
| 403 | 帳號密碼都對，但帳號被停用 | `此帳號已被停用` |
| 403 | 帳號密碼都對，但不屬於選的部門（ADMIN 不會有這個錯） | `此帳號不屬於「{部門中文}」，請改選其他部門`，例：`此帳號不屬於「客服」，請改選其他部門` |

> 為什麼「部門不對」要等密碼對了才說？
> 如果密碼錯也說「部門不對」，員工會以為是部門選錯，一直換部門試，其實是密碼打錯。
> 停用的帳號密碼錯時，一樣只回 401「帳號或密碼錯誤」。

### 過程中做了什麼

```
前端 POST /api/admin/auth/login
   │
   ▼
① Spring 把 JSON 轉成 StaffLoginRequest
   └─ 轉不過去（JSON 語法錯、department 不認識）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400
   │
   ▼
③ AdminAuthService.login()   ← 整段包在 @Transactional 裡
   ├─ 用 account 去 staff 表查員工（findByAccount）
   │    └─ 查不到 → 401「帳號或密碼錯誤」
   ├─ 用 BCrypt 比對密碼
   │    └─ 不符 → 401「帳號或密碼錯誤」
   ├─ 檢查 status 是不是 ACTIVE
   │    └─ 不是 → 403「此帳號已被停用」
   ├─ 員工部門不是 ADMIN，而且跟選的部門不一樣
   │    └─ 403「此帳號不屬於「…」，請改選其他部門」
   ├─ 更新 last_login_at = 現在時間
   └─ JwtService.generateStaffToken()：產生員工 JWT（sub = 員工 id，dept = 員工「所屬」部門）
   │
   ▼
④ 回 200 + JSON
```

**資料庫影響：** 更新 `staff` 表那筆員工的 `last_login_at`。

**補充：會員 token 和員工 token 怎麼分？**
兩種都是同一把金鑰簽的 JWT，差在員工 token 多一個 `dept` 欄位。
`JwtAuthFilter` 看到有 `dept` 就當員工、沒有就當會員，所以員工 token 不能拿來打會員 API，反過來也一樣。

---

## 2. 改自己的密碼 `PATCH /api/admin/auth/password`

> 🔒 **需要員工登入**：請求要帶 `Authorization: Bearer <員工 token>`。每個部門的員工都能用，改的是 token 裡的那個員工。

### Request

```json
{
  "oldPassword": "Test1234",
  "newPassword": "NewPass5678"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `oldPassword` | string | ✅ | 不可空白 |
| `newPassword` | string | ✅ | 不可空白、**8～72 字**（訊息：`密碼長度需為 8～72 字`） |

> **不用傳帳號**：改誰的密碼一律從 token 拿，前端傳不了別人的帳號，就改不到別人的密碼。
> 為什麼上限是 72？BCrypt 只看前 72 個 byte，再長的部分會被忽略。

### Response — 成功 `204 No Content`

沒有 body。

> 改完密碼**不會**讓現在的 token 失效，不用重新登入。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`oldPassword: 不得空白; newPassword: 密碼長度需為 8～72 字` |
| 400 | 舊密碼錯 | `密碼錯誤` |
| 400 | 新密碼跟舊密碼一樣 | `新密碼不能與舊密碼相同` |
| 401 | 沒帶 token、token 無效或過期 | `尚未登入或登入已失效` |
| 401 | 資料庫找不到 token 裡的員工 | `登入過期或失效` |
| 403 | 帶的是會員 token | `沒有權限使用這個功能` |
| 403 | 員工帳號已被停用（token 還沒過期） | `此帳號已被停用` |

### 過程中做了什麼

```
前端 PATCH /api/admin/auth/password
   │
   ▼
① SecurityConfig：/api/admin/** 要員工 token
   ├─ 沒 token → 401
   └─ 會員 token → 403
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400
   │
   ▼
③ AdminAuthService.changePassword()   ← 整段包在 @Transactional 裡
   ├─ CurrentStaff.require()：查出目前登入的員工
   │    ├─ 查不到 → 401「登入過期或失效」
   │    └─ 被停用 → 403「此帳號已被停用」
   ├─ BCrypt 比對舊密碼
   │    └─ 不符 → 400「密碼錯誤」
   ├─ BCrypt 比對新密碼是不是跟現在的一樣
   │    └─ 一樣 → 400「新密碼不能與舊密碼相同」
   └─ 新密碼用 BCrypt 加密後存回 password_hash
   │
   ▼
④ 回 204（沒有 body）
```

**資料庫影響：** 更新 `staff` 表那筆員工的 `password_hash`。

**補充：為什麼「新舊密碼一樣」也要用 BCrypt 比？**
資料庫只有雜湊、沒有明碼，沒辦法直接拿字串比較。BCrypt 每次加密結果都不一樣（有加鹽），所以要用 `passwordEncoder.matches(新密碼, 現在的雜湊)` 判斷。
