# 後台頁面說明：AdminLogin、AdminHome、MktHome

這份文件說明後台三個頁面「做什麼、怎麼運作、前後端怎麼串」。
元件的樹狀結構另見 [`structure/AdminHome.md`](../structure/AdminHome.md)、[`structure/MktHome.md`](../structure/MktHome.md)。

| 頁面 | 網址 | 檔案 | 誰用 |
|---|---|---|---|
| AdminLogin | `/admin/login` | `frontend/src/pages/admin/AdminLogin.jsx` | 所有員工 |
| AdminHome | `/admin/admin` | `frontend/src/pages/admin/AdminHome.jsx` | 系統管理（ADMIN） |
| MktHome | `/admin/mkt` | `frontend/src/pages/admin/MktHome.jsx` | 行銷（MKT），ADMIN 也能進 |

路由寫在 `App.jsx`：`/admin/*` 交給 `AdminLayout`，裡面的 `path="login"`、`path="admin"`、`path="mkt"` 分別對到這三頁。

---

## 共用的東西（`frontend/src/js/admin.js`）

### 五個部門

| key（跟後端 enum `Department` 一樣） | 畫面顯示 |
|---|---|
| `PRODUCT` | 商品部 |
| `ORDER` | 訂單物流 |
| `CS` | 客服 |
| `MKT` | 行銷 |
| `ADMIN` | 系統管理 |

一個員工只屬於一個部門。

### 員工登入資料存在 localStorage

| key | 內容 |
|---|---|
| `adminToken` | 員工 JWT |
| `adminName` | 姓名（頂部列顯示用） |
| `adminDept` | 登入時選的部門 |
| `adminAccount` | 帳號 |

- 員工 token 跟會員 token（`kinu.js` 的 `token`）**分開存**，避免前台 Header 以為會員登入了。
- 登出時 `clearAdminSession()` 把這四個都刪掉。

### 呼叫後台 API

- `adminApi(path, options)`：跟 `kinu.js` 的 `api()` 一樣，只是自動帶上員工 token。
- `adminDownload(path, fileName)`：下載檔案（例如匯出 Excel）。不能直接 `window.location` 過去，因為那樣不會帶 token，所以先 `fetch` 拿到檔案再讓瀏覽器存檔。

### 後端怎麼擋權限（`SecurityConfig.java`）

| 路徑 | 誰能用 |
|---|---|
| `POST /api/admin/auth/login` | 所有人（還沒登入才要登入） |
| `/api/admin/mkt/**` | MKT、ADMIN |
| `/api/admin/admin/**` | 只有 ADMIN |
| 其他 `/api/admin/**`（例如改密碼） | 任何員工 |

規則是「路徑上的部門代號 = 員工的部門」，ADMIN 例外，所有部門都能進。員工 token 不能打會員 API。

### 頂部列 AdminHeader（AdminHome、MktHome 都有）

`component/admin/shared/AdminHeader.jsx`

- 左邊顯示「目前登入：姓名（帳號）」，資料從 localStorage 讀。
- 右邊齒輪按鈕，點開有兩個選項，點選單外面會自動關起來：
  - **更改密碼**：開 `ChangePasswordModal`。
  - **登出**：清掉 localStorage，回到 `/admin/login`。

**ChangePasswordModal**（改自己的密碼）

- 欄位：舊密碼、新密碼、再輸入一次新密碼。
- 前端先檢查：都要填、新密碼 8～72 字、兩次新密碼要一樣。
- 送出 `PATCH /api/admin/auth/password`，後端再檢查：
  - 舊密碼錯 →「密碼錯誤」
  - 新密碼跟舊的一樣 →「新密碼不能與舊密碼相同」
- 改誰的密碼由後端從 token 判斷（`CurrentStaff`），前端不傳帳號，所以改不到別人的。

**Modal**：所有彈出視窗共用的外框，點灰色背景就關閉。

---

## 一、AdminLogin（員工登入）

### 畫面

1. 標題「KINU ADMIN／員工登入」。
2. **選擇部門**：五個按鈕排成格子，選中的反黑；每次進來預設第一個（商品部）。
3. **帳號、密碼**輸入框。
4. **登入**按鈕：送出中顯示「登入中…」並鎖住，避免連按。
5. 只有開發模式（`npm run dev`）才會在下方顯示測試帳號，密碼都是 `Test1234`：

| 部門 | 測試帳號 |
|---|---|
| 商品部 | product01 |
| 訂單物流 | order01 |
| 客服 | cs01 |
| 行銷 | mkt01 |
| 系統管理 | sys01 |

### 登入流程

1. 按登入 → 從表單讀帳號（去掉前後空白）和密碼；沒填就提示「請輸入帳號和密碼」。
2. 送出 `POST /api/admin/auth/login`，內容 `{ account, password, department }`。
3. 後端 `AdminAuthService.login()` 依序檢查：

| 順序 | 檢查 | 失敗訊息 |
|---|---|---|
| 1 | 帳號存在、密碼正確 | 「帳號或密碼錯誤」（不說是哪個錯） |
| 2 | 帳號是啟用中 | 「此帳號已被停用」 |
| 3 | 帳號屬於選的部門 | 「此帳號不屬於「○○」，請改選其他部門」 |

   - 第 3 步放在密碼檢查之後：密碼對了才告訴你部門選錯，避免員工以為密碼打錯。
   - **ADMIN 例外**：選哪個部門都能登入，會進那個部門的頁面，但 token 還是 ADMIN，保有所有部門的權限。
4. 通過後更新「最後登入時間」，回傳 token、姓名、部門、帳號。
5. 前端存進 localStorage，然後跳到 `/admin/` + 部門小寫，例如 `MKT` → `/admin/mkt`。
6. 失敗時用 toast 顯示後端的錯誤訊息，留在登入頁。

---

## 二、AdminHome（員工帳號管理）

只有 ADMIN 能用，後端 API 都在 `/api/admin/admin/staff`（`StaffController` → `StaffService`）。

### 畫面配置

- 左邊側邊選單：只有「員工帳號」一項。
- 右邊：AdminHeader + 內容區。
- 進頁面時如果 localStorage 沒有 `adminToken`，直接導回 `/admin/login`。

### 員工列表

- 右上角「＋新增員工」按鈕。
- **篩選列**（換任何條件都回到第一頁）：
  - 搜尋框：帳號或姓名，**按 Enter 才搜尋**，打字時不查。
  - 部門下拉：全部部門／五個部門。
  - 狀態下拉：全部狀態／啟用中／已停用。
- 送出 `GET /api/admin/admin/staff?page=&size=20&keyword=&department=&status=`，**每頁 20 筆**，分頁在後端做。
- 表格欄位：帳號、姓名、部門、狀態（● 啟用中／● 已停用）、最後登入、操作。
  - 已停用的整列變灰。
  - 自己那列帳號後面標「（你）」，操作欄顯示「不能修改自己的帳號」——改自己的密碼請用右上角設定。
- 載入中顯示「載入中…」；查不到顯示「沒有符合條件的員工」。
- 下方是分頁元件 `Pagination`（`component/common/`，跟商品頁共用）。

新增、改名、停用、啟用成功後，`reloadKey` +1 讓列表重新查一次。

### 每列的操作

| 按鈕 | 視窗 | API | 說明 |
|---|---|---|---|
| 編輯 | EditNameModal | `PATCH /staff/{account}/name` | **只能改姓名**，帳號顯示但不能改 |
| 重設密碼 | ResetPasswordModal | `POST /staff/{account}/reset-password` | 先確認「舊密碼會立刻失效」，確認後顯示新的臨時密碼 |
| 停用 | DisableModal | `PATCH /staff/{account}/disable` | 先確認，停用後馬上不能登入，之後可以再啟用 |
| 啟用 | 沒有視窗 | `PATCH /staff/{account}/enable` | 啟用不會擋人，所以不用確認，直接送出 |

（表中 API 前面都省略了 `/api/admin/admin`）

### 新增員工（CreateStaffModal）

- 欄位：帳號（**建立後不能改**）、姓名、部門（五選一，預設商品部）。
- **密碼不用填**，由系統產生。
- 送出 `POST /api/admin/admin/staff`；帳號重複會回「帳號代碼不能重複」。
- 成功後同一個視窗改成顯示臨時密碼。

### 臨時密碼（TempPassword）

新增員工、重設密碼共用。

- 顯示密碼和「複製」按鈕，複製成功變「已複製」兩秒。
- **關閉視窗後就再也看不到**：資料庫只存 BCrypt 雜湊，明碼只在這次回傳。
- 字元表拿掉了容易看錯的 `0/O`、`1/l/I`。

### 後端的保護

- 用帳號找員工，找不到回 404「找不到此員工帳號」。
- **不能停用自己**（「不能停用自己的帳號」）。因為呼叫的人一定是啟用中的 ADMIN、又不能停用自己，所以不會發生「ADMIN 全被停用、沒人能管」的情況。
- 被停用的員工就算手上還有舊 token，也會被 `CurrentStaff.require()` 擋下。

---

## 三、MktHome（行銷）

### 畫面配置

- 左邊 **SideMenu**、右邊 AdminHeader + 內容區。
- MktHome 本身只記「目前在哪個子頁面」（`currentPage`，預設 `coupon`），依值顯示對應的子頁面。
- 側邊選單分兩大類，**同時只能展開一類**，點已展開的會收合；目前所在的子頁面反黑。

| 大類 | 子頁面 | key |
|---|---|---|
| Coupon | 折價券 | `coupon` |
| | 發券給會員 | `issue` |
| | 發券紀錄 | `records` |
| 銷售數據 | 營收總覽 | `salesOverview` |
| | 商品銷售 | `productSales` |
| | 訂單結構 | `orderStructure` |
| | 會員與顧客 | `memberCustomers` |
| | 折價券成效 | `couponPerformance` |

- **銷售數據的五頁用 `lazy()` 載入**：它們用到 Plotly 圖表套件（約 4 MB），點進去才下載，不拖慢前台和其他後台頁。下載中顯示「載入中…」。
- 銷售數據的數字都是 **Python 算的**：React → Spring Boot（`/api/admin/mkt/sales/...`）→ Python（`analytics/` 資料夾）。Python 跟著 `docker compose up -d` 一起啟動。

### 3-1 折價券（CouponPage）

- 進來查 `GET /api/admin/mkt/coupons`，一次拿全部的券。
- **篩選在前端做**（CouponTable）：
  - 關鍵字：折扣碼或名稱，不分大小寫，打字就篩。
  - 狀態：全部／啟用中／已停用。
  - 發送方式：全部／不自動發送／生日禮。
- 每列有「編輯」和「停用／啟用」：
  - 停用／啟用：`PATCH /api/admin/mkt/coupons/{id}/disable` 或 `/enable`。
  - **停用只是不能再發**，已經發出去的券會員還是能用。

**新增折價券（CouponCreateModal）**

| 欄位 | 說明 |
|---|---|
| 折扣碼 | 只能英文、數字，自動轉大寫，**建立後不能改** |
| 名稱 | 必填 |
| 折扣方式 | 折固定金額（`AMOUNT`）／打折 %（`PERCENT`） |
| 折多少元／折幾 % | 依折扣方式切換標題 |
| 最低消費 | |
| 有效天數 | 預設 30（會員拿到券後幾天內要用） |
| 自動發送 | 不自動發送（只能手動發）／生日禮 |

送出 `POST /api/admin/mkt/coupons`。前端只檢查必填和折扣碼格式，其他規則交給後端：

- 折扣碼重複 →「這個折扣碼已經有了」
- 打折 % 要在 1～99 之間
- 折的金額要比最低消費小

**編輯折價券（CouponEditModal）**

- 欄位跟新增一樣，但折扣碼反灰不能改。
- 送出 `PUT /api/admin/mkt/coupons/{id}`。
- 這張券已經發出過的話，會顯示警告：**修改折扣內容，已發出、還沒用的券也會跟著變**。

折扣的顯示文字由 `discountText()` 產生：`AMOUNT` → 「折 100 元」；`PERCENT` → 「10% off（打 9 折）」。

### 3-2 發券給會員（IssuePage）

上半部是發券表單，下半部是預約發送紀錄。

**發券表單（IssueForm）**

1. **要發哪張券**：只列出啟用中的券，預設選第一張；選項顯示「折扣碼｜名稱（折扣，幾天）」。
2. **發給誰**：
   - 指定會員 → 顯示 **MemberPicker**：列出啟用中的會員（`GET /api/admin/mkt/members`），可用姓名或 Email 搜尋、複選，顯示已選幾位。還沒補填資料的會員沒有姓名，只比 Email。
   - 全部會員。
3. **什麼時候發**：
   - 立即發送。
   - 預約發送 → 選日期時間，不能選比現在早的。選「全部會員」的話，以**發送當下**的會員為準。
4. 送出 `POST /api/admin/mkt/coupons/{id}/grant`，內容 `{ targetAll, memberIds, scheduledAt }`。

後端會再檢查：券已停止發放、沒選會員、有會員不存在或已停用、預約時間要晚於現在。

預約的券由後端排程 `CouponSendScheduler` **每分鐘**檢查一次，時間到就發。

**預約發送紀錄（ScheduleTable）**

- 查 `GET /api/admin/mkt/coupons/schedules?status=&page=`，篩選和分頁都在後端做。
- 狀態：等待中、已發送、未發送、已取消（各有顏色）。
- **只有等待中的能取消**：`PATCH /api/admin/mkt/coupons/schedules/{id}/cancel`。
- 取消後如果這頁變空（例如正在篩「等待中」），自動退回上一頁。
- 排程發送後畫面不會自己更新，要按「重新整理」。

### 3-3 發券紀錄（RecordPage）

- 每一列是「某位會員拿到的一張券」，**只顯示，沒有按鈕**。
- 篩選列：會員（按「搜尋」或 Enter 才查）、折價券、來源（手動發券／自動：生日禮）、狀態（可使用／已使用／已過期）、發券日期區間。
- 顯示共幾筆；篩選和分頁都在後端做（`GET /api/admin/mkt/coupons/records`）。換篩選會回到第一頁。

### 3-4 銷售數據五頁

這五頁的共同點：

- 上方都有**期間按鈕**（`ToggleButtons`）：近 7 天／近 30 天／近 90 天／近 12 個月（折價券成效也一樣）。
- 有些圖的長條**點了可以篩選**，篩選條件顯示在 `SalesFilterBar`，每個條件有 ✕ 可以單獨取消，也能一次清除。
- 長條圖共用 `SalesBarChart`（Plotly）；指標卡片共用 `SalesStatCards`，可以標「▲ 需要處理」。

| 子頁面 | API | 內容 |
|---|---|---|
| 營收總覽 | `GET /sales/overview?range=` | 四張卡片（營業額、客單價、銷售件數、折扣總額），**跟上一期比漲跌**；營業額趨勢圖（實線本期、灰色虛線上一期）；匯出 Excel |
| 商品銷售 | `GET /sales/products`、`/sales/products/rank` | 點主分類／副分類長條篩選；三張卡片（銷售件數、有賣出的商品、滯銷商品）；顏色前 10 名、尺寸圖（沒篩選時可切換成人／童裝）；熱銷／滯銷排行 |
| 訂單結構 | `GET /sales/orders` | 點配送方式（宅配／超商）篩選；四張卡片（訂單數、取消率、平均出貨天數、待出貨超過 3 天）；配送／付款方式、訂單狀態分布、出貨速度、配送天數、取消分析 |
| 會員與顧客 | `GET /sales/members` | 點性別、年齡層篩選（兩個可同時選）；四張卡片（下單會員數、新客、回購客、新註冊會員）；新客與回購客表、性別年齡圖、消費 Top 10、每月新註冊會員數 |
| 折價券成效 | `GET /sales/coupons?range=` | 四張卡片（發出張數、使用率、用券訂單營業額、折扣總額）；每張券的成效表（依營業額排）；有用券 vs 沒用券的客單價比較 |

（表中 API 前面都省略了 `/api/admin/mkt`）

幾個細節：

- **匯出 Excel**（SalesExportForm）：選起訖日期，每天一列（日期、營業額、客單價、銷售件數、折扣總額）。日期預設帶入目前的期間，可選範圍是最早有訂單的那天～昨天。用 `adminDownload()` 下載。
- **商品排行**（ProductRankList）：每頁 10 件，自己跟後端要資料，換頁只重抓這一塊。
  - 熱銷：有賣出的商品，件數多的在前，長條長度是跟第 1 名比的比例。
  - 滯銷：上架中的商品，件數少的在前；件數一樣時**庫存多的排前面**，右邊多顯示庫存。
- **分類圖、配送方式圖本身不受篩選影響**：被選到的長條維持原色、其他變淡，方便再點別的。
- **每月新註冊會員數**：固定看最近 12 個月，不受期間按鈕影響，但會套用性別、年齡層篩選；還沒過完的月份用淡色。有篩選時會提醒「不含沒補填資料的會員」。
- **取消分析**（OrderCancelTable）：每列是「付款方式 + 取消原因」（信用卡、ATM 未付款取消、出貨前後台取消），取消率 = 已取消 ÷ 下單數。

---

## 附註：程式碼與既有文件不一致的地方

寫這份文件時發現的，**還沒修**：

1. `StaffService.randomPassword()` 的註解寫「產生 10 碼」，但程式實際產生 **20 碼**。
2. `structure/AdminHome.md` 寫 AdminHeader、Modal 等在 `component/admin/`，實際在 `component/admin/shared/`；TempPassword 實際在 `component/admin/staff/`；Pagination 實際在 `component/common/`。
3. `structure/MktHome.md` 的 CouponTable 說明舉例「自動：註冊禮」，但目前自動發送只有「生日禮」（`COUPON_TRIGGERS` 只有 `BIRTHDAY`）。
4. MktHome 沒有像 AdminHome 一樣在進頁面時檢查 token；沒登入直接打開 `/admin/mkt` 會看到畫面，但打 API 會被後端擋下並顯示錯誤（這是我依程式推測的行為，沒有實際跑過）。
