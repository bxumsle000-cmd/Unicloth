# MktHome 架構

`pages/admin/MktHome.jsx`（`/admin/mkt`）：行銷人員的折價券管理和銷售數據，側邊選單切換子頁面

```
MktHome
├─ SideMenu
├─ AdminHeader
│   └─ ChangePasswordModal
│       └─ Modal
├─ CouponPage
│   ├─ CouponTable
│   ├─ CouponCreateModal
│   │   └─ Modal
│   └─ CouponEditModal
│       └─ Modal
├─ IssuePage
│   ├─ IssueForm
│   │   └─ MemberPicker
│   └─ ScheduleTable
├─ RecordPage
├─ SalesOverviewPage
│   ├─ ToggleButtons
│   ├─ SalesKpiCards
│   ├─ RevenueChart
│   └─ SalesExportForm
├─ ProductSalesPage
│   ├─ ToggleButtons
│   ├─ SalesFilterBar
│   ├─ SalesStatCards
│   ├─ ProductCategoryCharts
│   │   └─ SalesBarChart
│   ├─ ProductRankList
│   │   ├─ ToggleButtons
│   │   └─ Pagination
│   └─ ProductColorSizeCharts
│       ├─ SalesBarChart
│       └─ ToggleButtons
├─ OrderStructurePage
│   ├─ ToggleButtons
│   ├─ SalesFilterBar
│   ├─ SalesStatCards
│   ├─ SalesBarChart
│   ├─ OrderShippingSpeed
│   │   └─ SalesBarChart
│   └─ OrderCancelTable
├─ MemberCustomersPage
│   ├─ ToggleButtons
│   ├─ SalesFilterBar
│   ├─ SalesStatCards
│   ├─ MemberBuyerTypeTable
│   ├─ MemberGenderAgeCharts
│   │   ├─ ToggleButtons
│   │   └─ SalesBarChart
│   ├─ MemberTopList
│   └─ MemberSignupChart
│       └─ SalesBarChart
└─ CouponPerformancePage
    ├─ ToggleButtons
    ├─ SalesStatCards
    ├─ CouponPerformanceTable
    └─ CouponCompareTable
```

## Component 作用

| Component | 位置 | 作用 |
|---|---|---|
| MktHome | `pages/admin/` | 頁面本體：記住目前在哪個子頁面，切換顯示 CouponPage／IssuePage／RecordPage／SalesOverviewPage／ProductSalesPage／OrderStructurePage／MemberCustomersPage／CouponPerformancePage |
| SideMenu | `component/admin/mkt/` | 側邊選單：大類（Coupon、銷售數據）可展開／收合，點子頁面切換 |
| AdminHeader | `component/admin/shared/` | 頂部列：顯示目前登入的人，設定選單（更改密碼、登出） |
| ChangePasswordModal | `component/admin/shared/` | 更改自己密碼的視窗 |
| Modal | `component/admin/shared/` | 共用的視窗外框，點背景關閉 |
| CouponPage | `component/admin/mkt/` | 折價券子頁面：新增按鈕、查折價券列表 |
| CouponTable | `component/admin/mkt/` | 篩選列（關鍵字、啟用狀態、自動發送）+ 折價券表格，每列有編輯、停用／啟用按鈕，自動發送的券標示「自動：註冊禮」等 |
| CouponCreateModal | `component/admin/mkt/` | 新增折價券，含折扣方式、自動發送時機 |
| CouponEditModal | `component/admin/mkt/` | 編輯折價券：欄位跟新增一樣但折扣碼不能改，已發出的券顯示修改警告 |
| IssuePage | `component/admin/mkt/` | 發券給會員子頁面：上面發券表單，下面預約發送紀錄 |
| IssueForm | `component/admin/mkt/` | 選券、發給誰（指定／全部會員）、立即或預約發送 |
| MemberPicker | `component/admin/mkt/` | 搜尋會員、複選，顯示已選幾位（選「指定會員」才顯示） |
| ScheduleTable | `component/admin/mkt/` | 預約發送表格，依狀態篩選，等待中的可以取消預約 |
| RecordPage | `component/admin/mkt/` | 發券紀錄子頁面：篩選列（會員、折價券、來源、狀態、發券日期區間）、顯示共幾筆、紀錄表格（只顯示，沒有按鈕） |
| SalesOverviewPage | `component/admin/mkt/` | 營收總覽子頁面：期間按鈕（7 天／30 天／90 天／12 個月）；數字由 Python 算（React → Spring Boot → `analytics/`），Python 跟著 `docker compose up -d` 一起啟動 |
| SalesKpiCards | `component/admin/mkt/` | 四張指標卡片（營業額、客單價、銷售件數、折扣總額），對比上一期漲跌 |
| RevenueChart | `component/admin/mkt/` | 營業額趨勢圖（Plotly），實線本期、虛線上一期 |
| SalesExportForm | `component/admin/mkt/` | 選起訖日期匯出 Excel，每天一列 |
| ProductSalesPage | `component/admin/mkt/` | 商品銷售子頁面：期間按鈕、篩選列（點分類圖的長條篩選主／副分類，篩選後重新跟 Python 要資料）、三張指標卡片，其他區塊交給下面的 component |
| ProductCategoryCharts | `component/admin/mkt/` | 主分類、副分類銷售額圖，點長條篩選，被選到的維持原色、其他變淡 |
| ProductRankList | `component/admin/mkt/` | 商品排行，可切換熱銷／滯銷，都依賣出件數排（滯銷件數一樣時庫存多的排前面），每頁 10 件，自己跟後端要資料、換頁只重抓這一塊 |
| ProductColorSizeCharts | `component/admin/mkt/` | 依顏色（前 10 名）、依尺寸的銷售件數圖；沒篩選時尺寸可切換成人／童裝 |
| SalesBarChart | `component/admin/mkt/` | 銷售數據共用的 Plotly 長條圖（直的或橫的），可以設定點長條時要做什麼 |
| ToggleButtons | `component/admin/mkt/` | 一排切換按鈕，選中的反黑（期間、排行依據、尺寸組別共用） |
| SalesFilterBar | `component/admin/mkt/` | 銷售數據頁的篩選條件列：每個篩選條件一個「女性 ✕」可以分開取消，加上清除按鈕 |
| SalesStatCards | `component/admin/mkt/` | 銷售數據頁的指標卡片（沒有對比上一期的那種），可以標「▲ 需要處理」 |
| OrderStructurePage | `component/admin/mkt/` | 訂單結構子頁面：篩選列（點配送方式的長條篩選宅配／超商）、四張指標卡片、配送／付款方式、訂單狀態分布 |
| OrderShippingSpeed | `component/admin/mkt/` | 出貨速度（訂單成立 → 出貨的天數分布）、配送天數（宅配、超商各段平均幾天） |
| OrderCancelTable | `component/admin/mkt/` | 取消分析表：信用卡、ATM 未付款取消，和出貨前由後台取消 |
| MemberCustomersPage | `component/admin/mkt/` | 會員與顧客子頁面：篩選列（點性別、年齡層的長條篩選，兩個可以同時選）、四張指標卡片 |
| MemberBuyerTypeTable | `component/admin/mkt/` | 新客與回購客：人數、消費金額、佔比、平均每人消費 |
| MemberGenderAgeCharts | `component/admin/mkt/` | 性別、年齡層圖，可切換看消費金額或下單人數，點長條篩選 |
| MemberTopList | `component/admin/mkt/` | 消費金額 Top 10 會員 |
| MemberSignupChart | `component/admin/mkt/` | 每月新註冊會員數（最近 12 個月，不受期間影響，還沒過完的月份用淡色） |
| CouponPerformancePage | `component/admin/mkt/` | 折價券成效子頁面：四張指標卡片（發出張數、使用率、用券訂單營業額、折扣總額） |
| CouponPerformanceTable | `component/admin/mkt/` | 每張券的成效：發出、使用率、訂單數、營業額、折扣成本，依營業額排序 |
| CouponCompareTable | `component/admin/mkt/` | 有用券與沒用券的訂單：客單價差多少 |
