# Unicloth 架構圖（C4 Model）

C4 Model 用「由遠到近」四層圖說明系統，像 Google 地圖一樣逐步放大：

| 層級 | 回答的問題 |
| --- | --- |
| 1. System Context（系統情境） | 誰在用 Unicloth？它跟哪些外部系統往來？ |
| 2. Container（容器） | Unicloth 由哪幾個「可以單獨啟動」的程式組成？ |
| 3. Component（元件） | Spring Boot 後端裡面分成哪些區塊？ |
| 4. Code（程式碼） | 類別之間的關係（這份文件只舉一個例子，其餘直接看程式碼） |

> 這裡的「Container」是 C4 的用語，意思是「一個可以單獨執行的程式或資料庫」，**不是**專指 Docker container。
> 圖用 Mermaid 畫，GitHub 和 IntelliJ（裝 Mermaid 外掛）都能直接顯示。

---

## 1. System Context（系統情境）

```mermaid
C4Context
    title Unicloth - System Context

    Person(member, "會員 / 訪客", "在前台瀏覽商品、加入購物車、下單付款、開客服工單")
    Person(staff, "後台員工", "依部門管理商品、訂單、客服、行銷（PRODUCT / ORDER / CS / MKT / ADMIN）")

    System(unicloth, "Unicloth 電商系統", "服飾電商：前台購物 + 後台管理")

    System_Ext(firebase, "Firebase Authentication", "Google 帳號登入，發給前端 ID token")
    System_Ext(ecpay, "綠界 ECPay", "金流（測試環境 payment-stage）")
    System_Ext(cloudflare, "Cloudflare Quick Tunnel", "提供對外 HTTPS 網址，讓綠界能通知本機")

    Rel(member, unicloth, "瀏覽、購物、付款", "HTTPS")
    Rel(staff, unicloth, "管理後台", "HTTPS")
    Rel(member, firebase, "用 Google 帳號登入")
    Rel(unicloth, firebase, "用 Google 公開金鑰驗證 ID token", "HTTPS / JWK")
    Rel(member, ecpay, "在綠界頁面付款")
    Rel(ecpay, cloudflare, "付款結果通知", "HTTPS POST")
    Rel(cloudflare, unicloth, "轉送付款通知")
```

**重點：**

- 會員登入不是自己存密碼，而是交給 **Firebase（Google 登入）**；後端只負責驗證 Firebase 給的 token，再發自己的 JWT。
- 員工登入走另一條路：帳號密碼存在自己的資料庫（`staff` 表）。
- 綠界的伺服器連不到 `localhost`，所以要靠 **Cloudflare Tunnel** 開一個對外網址，付款通知才進得來（詳見 [README-ECPAY.md](../README-ECPAY.md)）。

---

## 2. Container（容器）

```mermaid
C4Container
    title Unicloth - Container

    Person(member, "會員 / 訪客")
    Person(staff, "後台員工")

    System_Ext(firebase, "Firebase Authentication")
    System_Ext(ecpay, "綠界 ECPay")

    System_Boundary(unicloth, "Unicloth") {
        Container(spa, "React 前端", "React 19 + Vite + React Router", "前台商店 + 後台管理頁面；開發時 /api、/img 由 Vite 轉給 8080")
        Container(api, "後端 API", "Java / Spring Boot 4 + Spring Security + JPA", "所有商業邏輯、權限檢查、排程；port 8080")
        Container(analytics, "銷售分析服務", "Python / FastAPI + pandas", "計算行銷後台的銷售數據；只開給本機 port 8000")
        Container(proxy, "綠界通知代理", "Node.js（ecpay-callback-proxy.cjs）", "只放行 POST /api/payments/ecpay/notify；port 8787")
        Container(tunnel, "Tunnel", "cloudflared（Docker）", "對外 HTTPS → 本機 8787")
        ContainerDb(db, "資料庫", "SQL Server 2022（Docker）", "會員、商品、訂單、優惠券、工單…；結構由 Flyway 管理")
        Container(files, "商品圖片資料夾", "本機檔案系統", "後台上傳的商品圖，經 /img/products/** 提供")
    }

    Rel(member, spa, "使用", "瀏覽器")
    Rel(staff, spa, "使用", "瀏覽器")
    Rel(spa, firebase, "Google 登入，取得 ID token")
    Rel(spa, api, "呼叫 REST API", "JSON / HTTPS，Bearer JWT")
    Rel(api, firebase, "驗證 ID token", "JWK")
    Rel(api, db, "讀寫", "JDBC")
    Rel(api, files, "存 / 讀圖片")
    Rel(api, analytics, "轉送銷售數據查詢", "HTTP")
    Rel(analytics, db, "唯讀查詢", "pyodbc")
    Rel(member, ecpay, "被導到綠界付款頁")
    Rel(ecpay, tunnel, "付款通知", "HTTPS POST")
    Rel(tunnel, proxy, "轉送")
    Rel(proxy, api, "轉送", "HTTP")
    Rel(api, tunnel, "查目前的對外網址", "HTTP :20241")
```

**各容器怎麼啟動：**

| 容器 | 啟動方式 |
| --- | --- |
| 資料庫、Tunnel、銷售分析服務 | `docker compose up -d`（見 `docker-compose.yml`） |
| 後端 API | `./mvnw spring-boot:run` 或 IDEA 按 Run |
| 綠界通知代理 | `node ecpay-callback-proxy.cjs` |
| React 前端 | `frontend/` 裡 `npm run dev` |

**為什麼銷售數據不讓前端直接連 Python？**
Python 服務自己不檢查登入，所以只開給本機；前端一律先打 Spring Boot（`/api/admin/mkt/sales/**`），由 Spring Security 確認是 MKT 或 ADMIN 部門，再由 `AdminSalesService` 轉給 Python。

---

## 3. Component（元件）— 後端 API 內部

Spring Boot 採用分層架構：**Controller → Service → Repository → Entity**，一層只呼叫下一層。

```mermaid
C4Component
    title 後端 API - Component

    Container(spa, "React 前端")
    ContainerDb(db, "SQL Server")
    Container(analytics, "銷售分析服務（Python）")
    System_Ext(firebase, "Firebase")
    System_Ext(ecpay, "綠界 ECPay")

    Container_Boundary(api, "後端 API（Spring Boot）") {
        Component(security, "Security", "SecurityConfig、JwtAuthFilter、JwtService、FirebaseTokenVerifier", "驗 JWT、依路徑檢查角色（MEMBER / 部門）")
        Component(storeCtrl, "前台 Controller", "controller/store", "商品、分類、購物車、結帳、訂單、收藏、優惠券、客服、推薦")
        Component(adminCtrl, "後台 Controller", "controller/admin", "/api/admin/{部門}/**：商品、庫存、訂單、客服、行銷、員工")
        Component(shopSvc, "前台 Service", "service/shop", "購物、結帳、會員、推薦等商業邏輯")
        Component(ecpaySvc, "綠界 Service", "service/shop/ecpay", "產生付款表單、驗證 CheckMacValue、處理付款通知")
        Component(adminSvc, "後台 Service", "service/admin", "商品上下架、入庫、訂單處理、優惠券、員工管理")
        Component(scheduler, "排程", "service/scheduler", "逾時未付款取消、下架排程、優惠券發送、生日券")
        Component(repo, "Repository", "Spring Data JPA", "對資料表的存取")
        Component(exception, "例外處理", "GlobalExceptionHandler", "把 ApiException 轉成統一的錯誤 JSON")
    }

    Rel(spa, security, "HTTP 請求先經過")
    Rel(security, firebase, "會員登入時驗證 ID token")
    Rel(security, storeCtrl, "放行")
    Rel(security, adminCtrl, "放行")
    Rel(storeCtrl, shopSvc, "呼叫")
    Rel(storeCtrl, ecpaySvc, "呼叫")
    Rel(adminCtrl, adminSvc, "呼叫")
    Rel(shopSvc, repo, "使用")
    Rel(ecpaySvc, repo, "使用")
    Rel(adminSvc, repo, "使用")
    Rel(scheduler, repo, "使用")
    Rel(adminSvc, analytics, "轉送銷售數據查詢", "HTTP")
    Rel(ecpaySvc, ecpay, "產生付款參數 / 接收通知")
    Rel(repo, db, "SQL", "JDBC")
```

### 後台權限（只看部門）

| API 路徑 | 可進入的部門 |
| --- | --- |
| `/api/admin/product/**` | PRODUCT、ADMIN |
| `/api/admin/order/**` | ORDER、ADMIN |
| `/api/admin/cs/**` | CS、ADMIN |
| `/api/admin/mkt/**` | MKT、ADMIN |
| `/api/admin/admin/**` | ADMIN |

一個員工只屬於一個部門，規則寫在 `SecurityConfig`，部門定義在 `enums/staff/Department.java`。

### 排程（`service/scheduler`）

| 類別 | 做什麼 | 頻率 |
| --- | --- | --- |
| `OrderTimeoutScheduler` | 逾時未付款的訂單自動取消 | 每 10 分鐘 |
| `ProductOffShelfScheduler` | 到了下架時間的商品自動下架 | 依設定 |
| `CouponSendScheduler` | 到了發送時間的優惠券發給會員 | 每 1 分鐘 |
| `BirthdayCouponScheduler` | 發生日券 | 每天 0 點、12 點 |

---

## 4. Code（程式碼）— 舉例：下單付款流程

第 4 層通常不畫完整，只挑重要流程看。以下是「結帳 → 綠界付款 → 付款通知」的順序：

```mermaid
sequenceDiagram
    actor M as 會員
    participant FE as React 前端
    participant CC as CheckoutController
    participant CS as CheckoutService
    participant ES as EcpayService
    participant EP as 綠界 ECPay
    participant T as Tunnel + 代理(8787)
    participant EC as EcpayController
    participant CB as EcpayCallbackService
    participant DB as SQL Server

    M->>FE: 按「結帳」
    FE->>CC: POST /api/checkout（Bearer JWT）
    CC->>CS: checkout()
    CS->>DB: 寫入 Order / OrderItem、扣庫存（deductStock）
    FE->>EC: POST /api/payments/ecpay/create（orderNo）
    EC->>ES: createPayment()
    ES-->>FE: paymentUrl + 表單欄位 + CheckMacValue
    FE->>EP: 瀏覽器送出表單，進入綠界付款頁
    M->>EP: 輸入付款資料
    EP->>T: POST /api/payments/ecpay/notify
    T->>EC: 轉送通知
    EC->>CB: 處理通知
    CB->>CB: verifyCheckMacValue（確認真的是綠界送的）
    CB->>DB: 更新 Payment / Order 狀態
    EC-->>EP: 回 1|OK
```

> 庫存是在**建立訂單時**就扣（`CheckoutService` 呼叫 `deductStock`），不是付款後才扣；逾時沒付款的訂單會被 `OrderTimeoutScheduler` 取消。

---

## 相關文件

- [db-tables.md](db-tables.md)：資料表
- [auth-plan.md](auth-plan.md)：登入與權限
- [admin-pages.md](admin-pages.md)：後台頁面
- [sales-data-plan.md](sales-data-plan.md)：銷售數據
- [api/](api/)：各 API 規格
