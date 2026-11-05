# Admin Support Ticket API（客服後台：客服單）

- Controller：`controller/admin/AdminSupportTicketController.java`
- Service：`service/admin/AdminSupportTicketService.java`
- 共同前綴：`/api/admin/cs/tickets`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 客服單列表 | GET | `/api/admin/cs/tickets` | 200 | 客服單摘要（分頁） |
| 客服單詳細資料 | GET | `/api/admin/cs/tickets/{ticketId}` | 200 | 完整客服單 |
| 回覆客服單 | PATCH | `/api/admin/cs/tickets/{ticketId}/reply` | 200 | 更新後的完整客服單 |

會員送出客服單在 [support-ticket.md](../store/support-ticket.md)。

**`{ticketId}` 是什麼？** `support_tickets` 表的主鍵（列表回應裡的 `id`），不是給使用者看的 `ticketNo`。

**客服單狀態：**

| `status` | 中文 | 意思 |
|---|---|---|
| `IN_PROGRESS` | 處理中 | 剛送出，或回覆但沒結案 |
| `RESOLVED` | 已解決 | 回覆時選擇結案 |

> 🔒 **只有 CS、ADMIN 能用**：請求要帶 `Authorization: Bearer <員工 token>`（從 `/api/admin/auth/login` 取得，見 [admin-auth.md](admin-auth.md)）。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 其他部門的員工 token、會員 token | 403 | `沒有權限使用這個功能` |
>
> 下面各支 API 的「失敗」表格就不再重複列這兩種。

---

## 1. 客服單列表 `GET /api/admin/cs/tickets`

### Request

全部都是選填，沒帶就是不篩。

| 參數 | 位置 | 型別 | 說明 |
|---|---|---|---|
| `keyword` | 網址 | string | 客服單號、Email、問題類型、問題內容「包含」這段文字就算，不分大小寫；前後空白會去掉 |
| `status` | 網址 | string | `IN_PROGRESS` / `RESOLVED` |
| `page` | 網址 | number | 第幾頁，**從 0 開始**；預設 `0` |
| `size` | 網址 | number | 一頁幾筆；預設 `20` |
| `sort` | 網址 | string | 排序；預設 `createdAt,desc`（最新送出的在前面） |

範例：`GET /api/admin/cs/tickets?keyword=退換貨&status=IN_PROGRESS&page=0&size=20`

### Response — 成功 `200 OK`

```json
{
  "content": [
    {
      "id": 44,
      "ticketNo": "CS61617780",
      "email": "demo07@demo.unicloth.com",
      "topic": "商品諮詢",
      "status": "IN_PROGRESS",
      "createdAt": "2026-10-29T13:52:32",
      "repliedAt": null,
      "resolvedAt": null
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 46,
    "totalPages": 3
  }
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 客服單主鍵；詳細資料、回覆要用 |
| `ticketNo` | string | 客服單號，例：`CS61617780` |
| `email` | string | 聯絡 Email |
| `topic` | string | 問題類型 |
| `status` | string | 狀態 |
| `createdAt` | string | 送出時間 |
| `repliedAt` | string \| null | 最後回覆時間；還沒回覆是 `null` |
| `resolvedAt` | string \| null | 結案時間；還沒結案是 `null` |

> 列表**沒有**問題內容和回覆內容，點進詳細資料才拿。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 500 | `status` 不是上面列的值、`sort` 用了不存在的欄位 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/cs/tickets?...
   │
   ▼
① AdminSupportTicketService.getTickets()   ← @Transactional(readOnly = true)
   ├─ keyword 去掉前後空白
   ├─ 依條件查 support_tickets，分頁排序
   └─ 每一筆轉成 AdminSupportTicketListResponse
   │
   ▼
② 回 200 + JSON（content + page）
```

**資料庫影響：** 只有「讀」`support_tickets` 表，不會寫入任何資料。

---

## 2. 客服單詳細資料 `GET /api/admin/cs/tickets/{ticketId}`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `ticketId` | 路徑 | number | ✅ | 客服單主鍵 |

範例：`GET /api/admin/cs/tickets/44`

### Response — 成功 `200 OK`

```json
{
  "id": 44,
  "ticketNo": "CS61617780",
  "email": "demo07@demo.unicloth.com",
  "topic": "商品諮詢",
  "message": "PUFFTECH 輕暖科技外套(NANODESIGN) 會再補貨嗎？我要的尺寸一直缺貨。",
  "reply": null,
  "status": "IN_PROGRESS",
  "createdAt": "2026-10-29T13:52:32",
  "repliedAt": null,
  "resolvedAt": null
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id`、`ticketNo`、`email`、`topic`、`status`、`createdAt`、`repliedAt`、`resolvedAt` | | 同「客服單列表」 |
| `message` | string | 問題內容 |
| `reply` | string \| null | 客服回覆；還沒回覆是 `null` |

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 404 | 找不到客服單 | `找不到客服單：{ticketId}`，例：`找不到客服單：999` |
| 500 | `ticketId` 不是數字 | `系統發生錯誤，請稍後再試` |

### 過程中做了什麼

```
前端 GET /api/admin/cs/tickets/{ticketId}
   │
   ▼
① AdminSupportTicketService.getTicket()   ← @Transactional(readOnly = true)
   ├─ 用 id 查客服單 → 查不到 → 404
   └─ 轉成 AdminSupportTicketDetailResponse
   │
   ▼
② 回 200 + JSON
```

**資料庫影響：** 只有「讀」`support_tickets` 表，不會寫入任何資料。

---

## 3. 回覆客服單 `PATCH /api/admin/cs/tickets/{ticketId}/reply`

### Request

| 參數 | 位置 | 型別 | 必填 | 說明 |
|---|---|---|---|---|
| `ticketId` | 路徑 | number | ✅ | 客服單主鍵 |

```json
{
  "reply": "您好，這件商品預計下週補貨。",
  "resolve": true
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `reply` | string | ✅ | 不可空白（訊息：`請填寫回覆內容`）；最多 2000 字（訊息：`回覆內容不得超過 2000 個字`）；前後空白會去掉 |
| `resolve` | boolean | ✅ | 不可空（訊息：`請選擇是否結案`）；見下表 |

| `resolve` | `status` | `resolvedAt` |
|---|---|---|
| `true` | `RESOLVED` | 現在時間 |
| `false` | `IN_PROGRESS` | `null` |

> **只存一則回覆**：再回覆一次會**覆蓋**原本的 `reply`，`repliedAt` 也會更新。
> **已結案的可以重新開啟**：對 `RESOLVED` 的客服單傳 `resolve: false`，會回到 `IN_PROGRESS`、`resolvedAt` 清成 `null`。
> 回覆不會寄 Email，會員要到「我的客服單」看。

### Response — 成功 `200 OK`

更新後的完整客服單，格式同「客服單詳細資料」。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 例：`resolve: 請選擇是否結案; reply: 請填寫回覆內容` |
| 404 | 找不到客服單 | `找不到客服單：{ticketId}` |

### 過程中做了什麼

```
前端 PATCH /api/admin/cs/tickets/{ticketId}/reply
   │
   ▼
① @Valid 檢查 ReplySupportTicketRequest
   └─ 沒過 → 400
   │
   ▼
② AdminSupportTicketService.replyTicket()   ← 整段包在 @Transactional 裡
   ├─ 用 id 查客服單 → 查不到 → 404
   ├─ reply 去掉前後空白後存入，replied_at = 現在
   ├─ resolve 是 true → status = RESOLVED、resolved_at = 現在
   └─ resolve 是 false → status = IN_PROGRESS、resolved_at = null
   │
   ▼
③ 回 200 + 完整客服單
```

**資料庫影響：** `support_tickets` 表更新一筆的 `reply`、`replied_at`、`status`、`resolved_at`。
