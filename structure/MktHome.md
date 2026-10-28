# MktHome 架構

`pages/admin/MktHome.jsx`（`/admin/mkt`）：行銷人員的折價券管理頁，側邊選單切換三個子頁面

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
└─ RecordPage
```

## Component 作用

| Component | 位置 | 作用 |
|---|---|---|
| MktHome | `pages/admin/` | 頁面本體：記住目前在哪個子頁面，切換顯示 CouponPage／IssuePage／RecordPage |
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
