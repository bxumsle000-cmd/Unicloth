# Support Ticket API（客服單）

- Controller：`controller/store/SupportTicketController.java`
- Service：`service/shop/SupportTicketService.java`
- 共同前綴：`/api/support-tickets`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 送出客服單 | POST | `/api/support-tickets` | 201 | 剛建立的客服單（含單號） |
| 我送出的客服單 | GET | `/api/support-tickets` | 200 | 我送出的所有客服單 |

「送出客服單」要帶 JSON body；「我送出的客服單」不需要參數。客服人員回覆在後台（見 [admin-support-ticket.md](../admin/admin-support-ticket.md)）。

**兩支回的客服單長得一樣**（都是 `SupportTicketResponse`），欄位說明見「送出客服單」。

**客服單狀態：**

| `status` | 畫面顯示 | 意思 |
|---|---|---|
| `IN_PROGRESS` | 處理中 | 剛送出時的預設狀態；客服回覆但還沒結案也是這個 |
| `RESOLVED` | 已解決 | 客服回覆時選擇結案 |

> 🔒 **需要登入**：請求要帶 `Authorization: Bearer <token>`（token 從 `/api/auth/firebase` 取得），操作的是 token 裡的那個會員。
>
> | 情況 | 狀態碼 | `message` |
> |---|---|---|
> | 沒帶 token、token 無效或過期 | 401 | `尚未登入或登入已失效` |
> | 還沒補填會員資料 | 403 | `請先填寫會員資料` |
> | 帶的是員工 token | 403 | `沒有權限使用這個功能` |
> | 帳號被停用 | 403 | `此帳號已被停用` |
>
> 下面各支 API 的「失敗」表格就不再重複列這幾種。
>
> 資料表 `support_tickets.member_id` 允許 `NULL`，原本設計是「**未登入也能送客服單**」，但目前一律綁定目前的會員（見 `SupportTicketService` 的 TODO）。

---

## 1. 送出客服單 `POST /api/support-tickets`

### Request

```json
{
  "email": "test@example.com",
  "topic": "退換貨",
  "message": "我收到的衣服尺寸不對，想換成 M 號。"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `email` | string | ✅ | 不可空白；要是 Email 格式；最多 255 字；客服回覆用 |
| `topic` | string | ✅ | 不可空白；只能是下表其中一個（**中文字要完全一樣**） |
| `message` | string | ✅ | 不可空白；最多 2000 字 |

`topic` 可選的值：

| `topic` |
|---|
| `訂單與物流` |
| `退換貨` |
| `商品諮詢` |
| `付款與發票` |
| `折價券與活動` |
| `會員帳號問題` |
| `其他` |

> `email` **不一定要跟會員註冊的 Email 一樣**，填什麼就存什麼。

### Response — 成功 `201 Created`

```json
{
  "ticketNo": "CS04718263",
  "email": "test@example.com",
  "topic": "退換貨",
  "message": "我收到的衣服尺寸不對，想換成 M 號。",
  "reply": null,
  "status": "IN_PROGRESS",
  "createdAt": "2026-10-03T14:30:00",
  "repliedAt": null,
  "resolvedAt": null
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `ticketNo` | string | 客服單號，`CS` + 8 位數字，例如 `CS04718263`；給使用者看、查詢用 |
| `email` | string | 聯絡 Email |
| `topic` | string | 問題類型 |
| `message` | string | 問題內容 |
| `reply` | string \| null | 客服回覆；還沒回覆是 `null` |
| `status` | string | 狀態，剛送出一定是 `IN_PROGRESS` |
| `createdAt` | string | 送出時間，格式 `yyyy-MM-ddTHH:mm:ss`（可能帶小數秒） |
| `repliedAt` | string \| null | 最後回覆時間；還沒回覆是 `null` |
| `resolvedAt` | string \| null | 結案時間；還沒結案是 `null` |

> 回應裡**沒有客服單的 `id`**，前端用 `ticketNo` 辨識就好。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 見下表 |
| 400 | JSON 語法錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |

欄位驗證沒過時的 `message` 例子：

| 送了什麼 | `message` |
|---|---|
| `email` 沒帶或空白 | `email: 不得空白` |
| `email` 是 `abc` | `email: 必須是形式完整的電子郵件位址` |
| `email` 超過 255 字 | `email: 大小必須在 0 和 255 之間` |
| `topic` 沒帶 | `topic: 不得空白` |
| `topic` 是 `退貨`（不在清單裡） | `topic: 不是可選的問題類型` |
| `topic` 是空字串 `""` | `topic: 不得空白; topic: 不是可選的問題類型` |
| `message` 沒帶或空白 | `message: 不得空白` |
| `message` 超過 2000 字 | `message: 大小必須在 0 和 2000 之間` |

### 過程中做了什麼

```
前端 POST /api/support-tickets
   │
   ▼
① Spring 把 JSON 轉成 CreateSupportTicketRequest
   └─ 轉不過去（JSON 語法錯）→ 400
   │
   ▼
② @Valid 檢查欄位規則
   └─ 沒過 → 400（一次列出所有錯的欄位）
   │
   ▼
③ SupportTicketService.create()   ← 整段包在 @Transactional 裡
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 帳號被停用 → 403「此帳號已被停用」
   ├─ 產生客服單號：CS + 隨機 8 位數字
   │    └─ 資料庫已經有這個單號 → 重抽，直到不重複
   ├─ 新增一筆 SupportTicket 存進資料庫
   └─ 轉成 SupportTicketResponse
   │
   ▼
④ 回 201 + 剛建立的客服單 JSON
```

**資料庫影響：** `support_tickets` 表新增一筆。

| 欄位 | 值從哪來 |
|---|---|
| `id` | 資料庫自動遞增（IDENTITY） |
| `ticket_no` | 隨機產生的 `CS` + 8 位數字 |
| `member_id` | 目前登入的會員 |
| `email` | Request 的 `email` |
| `topic` | Request 的 `topic` |
| `message` | Request 的 `message` |
| `reply`、`replied_at`、`resolved_at` | `null` |
| `status` | `IN_PROGRESS`（預設值） |
| `created_at` | 寫入當下的時間 |

**單號的手動推演**：

| 步驟 | 值 |
|---|---|
| 抽一個 0 ~ 99,999,999 的隨機數 | `4718263` |
| 補零到 8 位（`%08d`） | `04718263` |
| 前面加 `CS` | `CS04718263` |
| 資料庫查 `CS04718263` 存不存在 | 不存在 → 就用它；存在 → 回第一步重抽 |

**補充：為什麼要先檢查「撞號」？**
資料庫有 `UNIQUE(ticket_no)`，單號不能重複。不先檢查就直接存，萬一抽到一樣的號碼，資料庫會擋下來，變成 500 錯誤。

---

## 2. 我送出的客服單 `GET /api/support-tickets`

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  {
    "ticketNo": "CS04718263",
    "email": "test@example.com",
    "topic": "退換貨",
    "message": "我收到的衣服尺寸不對，想換成 M 號。",
    "reply": null,
    "status": "IN_PROGRESS",
    "createdAt": "2026-10-03T14:30:00",
    "repliedAt": null,
    "resolvedAt": null
  },
  {
    "ticketNo": "CS91827364",
    "email": "test@example.com",
    "topic": "訂單與物流",
    "message": "請問訂單什麼時候會出貨？",
    "reply": "您好，訂單預計明天出貨。",
    "status": "RESOLVED",
    "createdAt": "2026-09-28T10:05:12",
    "repliedAt": "2026-09-28T15:20:00",
    "resolvedAt": "2026-09-28T15:20:00"
  }
]
```

欄位同「送出客服單」的回應。

> 順序是**最新送出的在最前面**。
> 沒有送過任何客服單時，回空陣列 `[]`。

### Response — 失敗

只有最上面列的共通錯誤。

### 過程中做了什麼

```
前端 GET /api/support-tickets
   │
   ▼
① SupportTicketService.getMyTickets()
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 帳號被停用 → 403「此帳號已被停用」
   ├─ 查 support_tickets 裡這個會員的所有客服單，照送出時間，新的在前
   └─ 每一筆轉成 SupportTicketResponse
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`support_tickets` 表，不會寫入任何資料。
