# Firebase（Google 登入）設定

> 整體的改版規劃與進度見 [`auth-plan.md`](auth-plan.md)。

## 組員：不用設定，clone 下來就能用

全組共用同一個 Firebase 專案 **`kinu-62cd9`**，設定值已經放在專案裡：

| 哪裡 | 檔案 | 內容 |
|---|---|---|
| 前端 | `frontend/.env` | `VITE_FIREBASE_API_KEY`、`AUTH_DOMAIN`、`PROJECT_ID`、`APP_ID` |
| 後端 | `src/main/resources/application.properties` | `firebase.project-id=${FIREBASE_PROJECT_ID:kinu-62cd9}` |

這些值本來就會打包進前端給瀏覽器下載，**不是機密**，所以直接進 git。
（後端只用 projectId 向 Google 下載公開金鑰來驗證 token，**不需要** service account 金鑰檔。）

### 試試看

1. 啟動後端、`npm run dev`（`.env` 改過的話要重新啟動，Vite 只有啟動時才會讀）
2. Header 右上角點「登入」→「使用 Google 登入」→ 選 Google 帳號
3. 第一次登入會被帶到「填寫會員資料」頁（`/complete-profile`），填完姓名、手機、性別、生日才能使用購物車、結帳等功能
4. 之後再登入會直接回首頁，Header 變成「登出」

---

## 管理 Firebase 專案（專案擁有者）

> Firebase Console 的畫面偶爾會改版，按鈕名稱可能跟這裡寫的不完全一樣，找意思相近的就對了。

### 開啟 Google 登入

1. <https://console.firebase.google.com> → 選 `kinu-62cd9`
2. 左側選單「建構（Build）」→「Authentication」→「登入方式（Sign-in method）」
3. 選「Google」→ 打開「啟用」→「專案的支援電子郵件」選自己的 email → 儲存

### 授權網域

「Authentication → 設定 → 授權網域」預設就有 `localhost`，本機開發不用改。
之後部署到別的網域，要把那個網域加進去，不然 Google 登入視窗會報錯。

### 看有哪些人登入過

「Authentication → 使用者」可以看到所有用 Google 登入過的帳號（對應資料庫 `members.firebase_uid`）。

---

## 想換成自己的 Firebase 專案測試

不要改 `frontend/.env`（會影響全組），改用只在自己電腦生效的設定：

1. 照上面的步驟在自己的 Firebase 專案開啟 Google 登入
2. 「專案設定 → 一般 → 你的應用程式」→ 新增網頁應用程式 `</>`，拿到 `firebaseConfig`
3. 前端：建 `frontend/.env.local`，寫要覆蓋的值（`.local` 不進 git，Vite 會優先讀它）
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. 後端：設定環境變數 `FIREBASE_PROJECT_ID=你的專案ID`
   （IDEA：Run → Edit Configurations → Environment variables）

前端和後端的專案 ID 一定要一樣，不然後端驗證 token 會失敗（401「Google 登入驗證失敗」）。
