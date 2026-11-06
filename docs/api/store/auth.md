# Auth API（Google 登入 / 登出）

- Controller：`controller/store/AuthController.java`
- Service：`service/shop/AuthService.java`
- 共同前綴：`/api/auth`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| Google 登入 | POST | `/api/auth/firebase` | 200 | `{ memberId, token, profileCompleted }` |

這支**不需要登入**。

---

## 1. Google 登入 `POST /api/auth/firebase`

前端先用 Firebase SDK 跳出 Google 登入視窗，拿到 Firebase 的 **ID token**，再送來這裡換我們自己的 JWT。
之後呼叫其他 API 時，放在 header：`Authorization: Bearer <token>`（JWT 有效 1 天）。

> 全組共用 Firebase 專案 `kinu-62cd9`，前端設定在 `frontend/.env`、後端在 `application.yml`，clone 下來就能用。細節見 [`docs/firebase-setup.md`](../../firebase-setup.md)。

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

```json
{
  "memberId": 1,
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "profileCompleted": true
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `memberId` | number | 會員 id |
| `token` | string | 我們自己的 JWT，有效 1 天 |
| `profileCompleted` | boolean | 會員資料填了沒；第一次登入的新會員是 `false`，前端要導去 `/complete-profile` 補填 |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | `idToken` 沒填 | `idToken: 不得空白` |
| 400 | Google 帳號沒有 email | `這個 Google 帳號沒有提供 email，無法登入` |
| 401 | ID token 無效、過期、不是我們 Firebase 專案發的 | `Google 登入驗證失敗，請重新登入` |
| 403 | 帳號被停用 | `此帳號已被停用` |
| 409 | 同一個 email 已經註冊過，但 Google 沒驗證過這個 email，或那個帳號已經綁了別的 Google 帳號 | `此email已經註冊過` |
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
   ├─ 用 firebase_uid 找會員 → 找到就是這位會員
   ├─ 找不到，Google 帳號沒有 email → 400
   ├─ 找不到，但 email 已經註冊過
   │    ├─ Google 驗證過 email，且那個帳號還沒綁 Google → 把 uid 綁上去
   │    └─ 否則 → 409
   ├─ 都找不到 → 建新會員（只有 email + firebase_uid，沒有個人資料）
   ├─ 檢查 status 是不是 ACTIVE → 不是就 403
   └─ JwtService 產生 JWT，查 member_profiles 判斷 profileCompleted
   │
   ▼
③ 回 200 + JSON
```

**資料庫影響：** 第一次登入會在 `members` 新增一筆；綁定既有帳號時會更新那筆的 `firebase_uid`。
新會員**還沒有** `member_profiles`，要先呼叫 `PUT /api/member/me/complete-profile` 補填（見 [member.md](member.md)），在那之前其他要登入的會員 API 都回 403。
