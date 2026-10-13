# 登入機制改版規劃（JWT + Google 登入）

目標：拿掉帳號密碼登入，**只用 Google（Firebase）登入**；登入後由後端發自己的 JWT，所有需要登入的 API 都靠 JWT 辨識會員。

## 進度

| 步驟 | 內容 | 狀態 |
|---|---|---|
| 1 | JWT：登入發 token、`JwtAuthFilter` 驗 token、`CurrentMember` 從 token 取會員 | ✅ 完成 |
| — | 會員拆成兩張表：`members`（帳號）＋ `member_profiles`（個人資料） | ✅ 完成 |
| 2 | Google 登入：`POST /api/auth/firebase`、前端登入頁 | ✅ 程式完成，⚠️ 還沒用真的 Firebase 專案登入過 |
| 3 | 第一次登入後強制補填個人資料 | ✅ 完成 |
| 4 | 拿掉帳號密碼登入 | ⬜ 未開始 |

Firebase 專案的設定步驟見 [`firebase-setup.md`](firebase-setup.md)。

---

## 步驟 3：強制補填個人資料（✅ 完成）

Google 只給 email 和名字，沒有電話、性別、生日，但結帳需要這些資料。
用 Google 第一次登入時只會建 `members`，**補填完才建 `member_profiles`**，所以「有沒有 profile」就代表「資料補齊了沒」。

| 項目 | 做法 |
|---|---|
| 判斷有沒有補齊 | `memberProfileRepository.existsById(memberId)`，不用另外加欄位 |
| 告訴前端 | `LoginResponse`、`GET /api/member/me` 多帶 `profileCompleted`（true / false） |
| 補填 API | 新增 `PUT /api/member/me/complete-profile`，收 name、phone、gender、birthday、address（address 選填），新增一筆 `member_profiles` |
| 後端阻擋 | 沒補齊時，除了 `GET /api/member/me` 和補填 API 之外，其他要登入的 API 一律回 403（只做前端導頁可以被繞過）。寫在 `SecurityConfig` 的授權規則 `profileCompleted()` |
| 前端路由守衛 | 已登入但 `profileCompleted = false`，離開 `/complete-profile` 就當成不想填、自動登出；下次 Google 登入會再帶去補填（`component/ProfileGuard.jsx`） |
| 名字 | 補填頁先帶入 Google 給的名字，讓使用者可以改（`firebase.js` 的 `getGoogleName()`） |
| 補填頁 | `pages/CompleteProfile.jsx`；只能補填一次，第二次回 409，之後改資料走 `PUT /api/member/me/profile` |

補填完不用重發 token：token 裡只放會員 id，「補齊了沒」每次都查資料庫，不會有舊 token 狀態不對的問題。

---

## 步驟 4：拿掉帳號密碼登入

### 為什麼現在還不刪

- **測試要用**：Firebase 專案還沒建好、Google 登入還沒實際跑通，現在要拿 token 測其他 API 只能靠密碼登入
- **組員要用**：還沒設定 Firebase 的人，只能用測試帳號 `test@unicloth.com` / `Test1234` 登入

### 什麼時候刪

Google 登入實際跑通、步驟 3 補填資料也做好之後，再一起刪。

### 刪除前要先決定：之後測試怎麼拿 token

拿掉密碼登入後，Swagger、curl、Postman 就沒辦法直接拿 token 了（Google 登入一定要經過瀏覽器的登入視窗）。

| 做法 | 優點 | 缺點 |
|---|---|---|
| 從瀏覽器 localStorage 複製 token（key 是 `token`） | 不用寫任何程式 | 每次 token 過期（1 天）都要重新複製 |
| 保留一支「只在開發環境啟用」的測試登入 API | 測試很方便 | 多一個要小心的地方：設定錯讓它在正式環境也能用，就是安全漏洞 |

### 要刪 / 要改的地方

**後端**
- `controller/AuthController.java`：刪 `/login`、`/register`
- `service/AuthService.java`：刪 `login()`、`register()`
- `dto/auth/LoginRequest.java`、`dto/auth/RegisterRequest.java`：刪除
- `controller/MemberController.java`、`service/MemberService.java`：刪修改密碼 `PATCH /api/member/me/password`
- `dto/member/ChangePasswordRequest.java`：刪除
- `security/PasswordConfig.java`：刪除（沒有密碼就不需要 BCrypt）
- `security/SecurityConfig.java`：放行清單拿掉 `/api/auth/login`、`/api/auth/register`
- `entity/Member.java`：刪 `passwordHash`
- 新增 migration（例如 `V4__drop_password_hash.sql`）刪掉 `members.password_hash`；**不要改 V1～V3**（跑過的 migration 改了 Flyway 會啟動失敗）

**測試**
- 這幾個測試建假會員時有 `.passwordHash("x")`，要拿掉：`CheckoutCouponConcurrencyTest`、`CheckoutServiceTest`、`SupportTicketServiceTest`、`WishlistServiceTest`、`AuthServiceFirebaseLoginTest`
- `AuthServiceFirebaseLoginTest` 裡「Google 會員不能用密碼登入」「email 已用密碼註冊過就綁定」這幾個測試要刪或改寫

**文件**
- `docs/api/auth.md`：刪登入、註冊章節
- `docs/api/member.md`：刪修改密碼章節
- `README.md` 或 `docs/firebase-setup.md`：補上「怎麼拿測試用 token」（依上面決定的做法）
