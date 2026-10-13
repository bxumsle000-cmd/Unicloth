# Auth API（登入 / Google 登入 / 註冊 / 登出）

- Controller：`controller/AuthController.java`
- Service：`service/AuthService.java`
- 共同前綴：`/api/auth`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 登入 | POST | `/api/auth/login` | 200 | `{ memberId, token, profileCompleted }` |
| Google 登入 | POST | `/api/auth/firebase` | 200 | `{ memberId, token, profileCompleted }` |
| 註冊 | POST | `/api/auth/register` | 204 | 沒有 body |
| 登出 | POST | `/api/auth/logout` | 204 | 沒有 body |

---

## 1. 登入 `POST /api/auth/login`

> 📌 帳號密碼登入、註冊之後會拿掉，只保留 Google 登入；目前保留是為了測試，規劃見 [`docs/auth-plan.md`](../auth-plan.md) 步驟 4。

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
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwiaWF0Ijo...",
  "profileCompleted": true
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `memberId` | number | 登入會員的 id |
| `token` | string | JWT，有效 1 天。之後呼叫需要登入的 API 時，放在 header：`Authorization: Bearer <token>` |
| `profileCompleted` | boolean | 會員資料填了沒；`false` 時前端要導去 `/complete-profile` 補填 |

> 前端的 `kinu.js` 會自動從 localStorage 讀 token 帶上 header，各頁面呼叫 `api()` 不用自己處理。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `email` 或 `password` 沒填、email 格式錯 | 例：`email: 必須是格式正確的電子郵件地址` |
| 401 | 查不到這個 email | `帳號或密碼錯誤` |
| 401 | email 存在但密碼錯 | `帳號或密碼錯誤` |
| 401 | 這個帳號是用 Google 登入建立的，沒有密碼 | `帳號或密碼錯誤` |
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
   └─ 全部通過 → JwtService 產生 JWT，組出 LoginResponse(memberId, token)
   │
   ▼
④ 回 200 + JSON
```

**資料庫影響：** 只有「讀」`members` 表，不會寫入任何資料。

**補充：BCrypt 比對是怎麼回事？**
資料庫不存明碼密碼，只存 BCrypt 算出來的雜湊值（例如 `$2a$10$Xk...`）。登入時不是把雜湊「解回」明碼，而是用 `passwordEncoder.matches(明碼, 雜湊)` 判斷「這組明碼算出來是否對得上這個雜湊」。

---

## 2. Google 登入 `POST /api/auth/firebase`

前端先用 Firebase SDK 跳出 Google 登入視窗，拿到 Firebase 的 **ID token**，再送來這裡換我們自己的 JWT。
之後呼叫其他 API 用的都是我們的 JWT，跟帳號密碼登入完全一樣。

> 全組共用 Firebase 專案 `kinu-62cd9`，前端設定在 `frontend/.env`、後端在 `application.properties`，clone 下來就能用。細節見 [`docs/firebase-setup.md`](../firebase-setup.md)。

### Request

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `idToken` | string | ✅ | 不可空白；前端 `user.getIdToken()` 拿到的值 |

### Response — 成功 `200 OK`

跟帳號密碼登入一樣：`{ memberId, token, profileCompleted }`。第一次登入的新會員 `profileCompleted` 是 `false`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `idToken` 沒填 | `idToken: 不得空白` |
| 400 | Google 帳號沒有 email | `這個 Google 帳號沒有提供 email，無法登入` |
| 401 | ID token 無效、過期、不是我們 Firebase 專案發的 | `Google 登入驗證失敗，請重新登入` |
| 403 | 帳號被停用 | `此帳號已被停用` |
| 409 | 同一個 email 已用密碼註冊，但 Google 沒驗證過這個 email，或那個帳號已經綁了別的 Google 帳號 | `此email已經註冊過` |
| 503 | 後端的 `firebase.project-id` 是空的 | `伺服器尚未設定 Firebase，暫時無法使用 Google 登入` |

### 過程中做了什麼

```
前端 POST /api/auth/firebase
   │
   ▼
① FirebaseTokenVerifier.verify()：驗證 ID token
   ├─ 用 Google 公開的公鑰驗簽章（第一次會去 Google 下載，之後快取）
   ├─ 檢查 exp（沒過期）、iss / aud（是我們的 Firebase 專案）、sub（uid 不可空白）
   └─ 任一項不過 → 401
   │
   ▼
② AuthService.firebaseLogin()   ← 整段包在 @Transactional 裡
   ├─ 用 firebase_uid 找會員 → 找到就是他
   ├─ 找不到，但 email 已經用密碼註冊過
   │    ├─ Google 驗證過 email，且那個帳號還沒綁 Google → 把 uid 綁上去
   │    └─ 否則 → 409
   ├─ 都找不到 → 建新會員（只有 email + firebase_uid，沒有密碼、沒有個人資料）
   ├─ 檢查 status 是不是 ACTIVE → 不是就 403
   └─ JwtService 產生 JWT
   │
   ▼
③ 回 200 + JSON
```

**資料庫影響：** 第一次登入會在 `members` 新增一筆；綁定既有帳號時會更新那筆的 `firebase_uid`。
新會員**還沒有** `member_profiles`，要先呼叫 `PUT /api/member/me/complete-profile` 補填（見 `member.md`），在那之前其他要登入的 API 都回 403。

---

## 3. 註冊 `POST /api/auth/register`

> 📌 帳號密碼登入、註冊之後會拿掉，只保留 Google 登入；目前保留是為了測試，規劃見 [`docs/auth-plan.md`](../auth-plan.md) 步驟 4。

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
   ├─ 存帳號進 members 表（email、password_hash）
   │    ├─ status 預設 ACTIVE
   │    └─ created_at 由 Hibernate 自動填現在時間
   └─ 用剛拿到的會員 id 存個人資料進 member_profiles 表
   │
   ▼
④ 回 204（沒有 body）
```

**資料庫影響：** `members`、`member_profiles` 各新增一筆。

| 表 | 欄位 | 值從哪來 |
|---|---|---|
| `members` | `id` | 資料庫自動遞增（IDENTITY） |
| `members` | `email` | Request 原封不動 |
| `members` | `password_hash` | Request 的 `password` 經 BCrypt 加密 |
| `members` | `status` | 固定 `ACTIVE` |
| `members` | `created_at` | 寫入當下的時間 |
| `member_profiles` | `member_id` | 上面那筆 `members.id` |
| `member_profiles` | `name`、`phone`、`gender`、`birthday`、`address` | Request 原封不動 |

---

## 4. 登出 `POST /api/auth/logout`

### Request

不需要 body。

### Response — 成功 `204 No Content`

沒有 body。

### 過程中做了什麼

**後端什麼都沒做**，方法是空的，呼叫一定回 204。
JWT 是「無狀態」的：後端不記錄發過哪些 token，所以也沒辦法讓某一張 token 失效。
登出就是前端把 localStorage 裡的 token 刪掉（`kinu.js` 的 `clearToken()`），沒有 token 就等於沒登入。
被複製走的 token 在過期前（1 天）還是能用，這是 JWT 的取捨。
