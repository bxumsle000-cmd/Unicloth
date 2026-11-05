# Admin Mkt Member API（行銷後台：發券選會員）

- Controller：`controller/admin/AdminMktMemberController.java`
- Service：`service/admin/AdminCouponService.java`
- 共同前綴：`/api/admin/mkt/members`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 發券時可以選的會員 | GET | `/api/admin/mkt/members` | 200 | 會員清單 |

目前只給「發券給會員」（[admin-coupon.md](admin-coupon.md)）選會員用。

> 🔒 **只有 MKT、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。

---

## 1. 發券時可以選的會員 `GET /api/admin/mkt/members`

### Request

不需要參數。**用姓名、Email 搜尋在前端做**。

### Response — 成功 `200 OK`

```json
[
  { "id": 1, "name": "林雅婷", "email": "demo01@demo.unicloth.com" },
  { "id": 2, "name": null, "email": "new-member@example.com" }
]
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 會員 id，發券時放進 `memberIds` |
| `name` | string \| null | 姓名；還沒補填會員資料是 `null` |
| `email` | string | 登入 Email |

> 只有狀態 `ACTIVE` 的會員，停用的不能發。
> 順序是 id 由小到大，沒有分頁。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 沒帶 token、token 無效或過期 | `尚未登入或登入已失效` |
| 403 | 其他部門的員工 token、會員 token | `沒有權限使用這個功能` |

### 過程中做了什麼

```
前端 GET /api/admin/mkt/members
   │
   ▼
① AdminCouponService.getIssueMembers()   ← @Transactional(readOnly = true)
   └─ 查狀態 ACTIVE 的會員，left join member_profiles 拿姓名，直接轉成 IssueMemberResponse
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`members`、`member_profiles` 表，不會寫入任何資料。
