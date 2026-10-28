# AdminHome 架構

`pages/admin/AdminHome.jsx`（`/admin/admin`）：系統管理員的員工帳號管理頁

```
AdminHome
├─ AdminHeader
│   └─ ChangePasswordModal
│       └─ Modal
├─ StaffTable
├─ Pagination
├─ CreateStaffModal
│   ├─ Modal
│   └─ TempPassword
├─ EditNameModal
│   └─ Modal
├─ ResetPasswordModal
│   ├─ Modal
│   └─ TempPassword
└─ DisableModal
    └─ Modal
```

## Component 作用

| Component | 位置 | 作用 |
|---|---|---|
| AdminHome | `pages/admin/` | 頁面本體：側邊選單、篩選列、查員工列表、控制開哪個視窗 |
| AdminHeader | `component/admin/` | 頂部列：顯示目前登入的人，設定選單（更改密碼、登出） |
| ChangePasswordModal | `component/admin/` | 更改自己密碼的視窗 |
| Modal | `component/admin/` | 共用的視窗外框，點背景關閉 |
| TempPassword | `component/admin/` | 顯示臨時密碼，附複製按鈕 |
| StaffTable | `component/admin/staff/` | 員工表格，每列有編輯、重設密碼、停用／啟用按鈕 |
| Pagination | `component/product/` | 分頁（跟商品頁共用） |
| CreateStaffModal | `component/admin/staff/` | 新增員工，成功後顯示臨時密碼 |
| EditNameModal | `component/admin/staff/` | 修改員工姓名 |
| ResetPasswordModal | `component/admin/staff/` | 確認後重設密碼，顯示新的臨時密碼 |
| DisableModal | `component/admin/staff/` | 確認後停用員工帳號 |
