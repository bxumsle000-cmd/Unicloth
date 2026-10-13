# Firebase（Google 登入）設定步驟

> 整體的改版規劃與進度見 [`auth-plan.md`](auth-plan.md)。

Google 登入需要一個 Firebase 專案。每個人可以用自己的專案，也可以全組共用一個。
沒設定的話，其他功能都正常，只有「使用 Google 登入」按鈕不能按，後端 `/api/auth/firebase` 回 503。

> Firebase Console 的畫面偶爾會改版，按鈕名稱可能跟這裡寫的不完全一樣，找意思相近的就對了。

## 1. 建立 Firebase 專案

1. 到 <https://console.firebase.google.com>，用 Google 帳號登入
2. 「建立專案」→ 取名（例如 `unicloth`）→ Google Analytics 可以關掉 → 建立

## 2. 開啟 Google 登入

1. 左側選單「建構（Build）」→「Authentication」→「開始使用」
2. 「登入方式（Sign-in method）」分頁 → 選「Google」→ 打開「啟用」
3. 「專案的支援電子郵件」選自己的 email → 儲存

「設定 → 授權網域」預設就有 `localhost`，本機開發不用改。之後部署到別的網域，要把那個網域加進去。

## 3. 取得前端設定值

1. 左上角齒輪 →「專案設定」→「一般」分頁
2. 往下到「你的應用程式」→ 點網頁圖示 `</>` → 取個暱稱 → 註冊應用程式（不用勾 Hosting）
3. 畫面會出現一段 `firebaseConfig`，記下 `apiKey`、`authDomain`、`projectId`、`appId`

## 4. 填進專案

### 前端

複製 `frontend/.env.example`，改名成 `frontend/.env.local`，填入上一步的值：

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=unicloth-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=unicloth-xxxxx
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

`.env.local` 不會進 git（`.gitignore` 有 `*.local`）。改完要**重新啟動** `npm run dev`。

### 後端

設定環境變數 `FIREBASE_PROJECT_ID`，值跟上面的 `projectId` 一樣：

- IDEA：Run → Edit Configurations → 選 Spring Boot 的設定 → Environment variables 填 `FIREBASE_PROJECT_ID=unicloth-xxxxx`
- 改完要重新啟動後端

後端只用 projectId 驗證 token（向 Google 下載公開金鑰），**不需要** service account 金鑰檔。

## 5. 試試看

1. 打開前端，Header 右上角點「登入」
2. 按「使用 Google 登入」→ 選 Google 帳號
3. 成功會回到首頁，Header 變成「登出」

第一次用 Google 登入會自動建立會員，但這時還沒有個人資料（姓名、電話等），
所以「會員資料」相關的 API 會回 404「尚未填寫會員資料」，要等補填資料的功能做好。
