# Support Ticket API（客服單）

- Controller：`controller/SupportTicketController.java`
- Service：`service/SupportTicketService.java`
- 共同前綴：`/api/support-tickets`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 送出客服單 | POST | `/api/support-tickets` | 201 | 剛建立的客服單（含單號） |
| 我送出的客服單 | GET | `/api/support-tickets` | 200 | 我送出的所有客服單 |

「送出客服單」要帶 JSON body；「我送出的客服單」不需要參數。

**兩支回的客服單長得一樣**（都是 `SupportTicketResponse`），欄位說明見「送出客服單」。

**客服單狀態：**

| `status` | 畫面顯示 | 意思 |
|---|---|---|
| `IN_PROGRESS` | 處理中 | 剛送出時的預設狀態 |
| `RESOLVED` | 已解決 | 客服處理完畢 |

> 目前**沒有任何 API 會改狀態**，所以透過這兩支 API 看到的一定是 `IN_PROGRESS`。

> ⚠️ **目前是開發用的假登入**：這兩支 API 都是操作「目前登入的會員」，而 `security/CurrentMember.java` **寫死會員 id = 1**，不會看前端帶的 token。
>
> 資料表 `support_tickets.member_id` 允許 `NULL`，原本設計是「**未登入也能送客服單**」，但目前分不出有沒有登入，所以先一律綁定目前的會員（見 `SupportTicketService` 的 TODO）。

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
| `message` | string | ✅ | 不可空白；最多 2000 字（資料表欄位也是 `NVARCHAR(2000)`） |

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
  "status": "IN_PROGRESS",
  "createdAt": "2026-10-03T14:30:00"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `ticketNo` | string | 客服單號，`CS` + 8 位數字，例如 `CS04718263`；給使用者看、查詢用 |
| `email` | string | 聯絡 Email |
| `topic` | string | 問題類型 |
| `message` | string | 問題內容 |
| `status` | string | 狀態，剛送出一定是 `IN_PROGRESS` |
| `createdAt` | string | 送出時間，格式 `yyyy-MM-ddTHH:mm:ss`（可能帶小數秒） |

> 回應裡**沒有客服單的 `id`**，前端用 `ticketNo` 辨識就好。
> `createdAt` 小數秒的位數我**沒有實際確認**，這是推測；前端顯示日期時建議只取前面的 `yyyy-MM-dd`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 400 | 欄位驗證沒過 | 見下表 |
| 400 | JSON 語法錯誤 | `請求內容格式錯誤，請確認欄位值是否正確` |
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

欄位驗證沒過時的 `message` 例子：

| 送了什麼 | `message` |
|---|---|
| `email` 沒帶或空白 | `email: 不得空白` |
| `email` 是 `abc` | `email: 必須是形式完整的電子郵件位址` |
| `email` 超過 255 字 | `email: 大小必須在 0 和 255 之間` |
| `topic` 沒帶 | `topic: 不得空白` |
| `topic` 是 `退貨`（不在清單裡） | `topic: 不是可選的問題類型` |
| `message` 沒帶或空白 | `message: 不得空白` |
| `message` 超過 2000 字 | `message: 大小必須在 0 和 2000 之間` |

> 多個欄位都錯時，會用 `; ` 接成一句，例如 `email: 不得空白; message: 不得空白`（順序不固定）。
> `topic` 送空字串 `""` 時，`@NotBlank` 和 `@Pattern` 都會不過，我**推測**會同時出現兩句：`topic: 不得空白; topic: 不是可選的問題類型`。沒有實際測過。
> 以上預設訊息是 Hibernate Validator 的繁中版本（`ValidationMessages_zh_TW`），伺服器語系不同時文字可能不一樣。

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
   │    └─ 查不到 → 401「登入過期或失效」
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
    "status": "IN_PROGRESS",
    "createdAt": "2026-10-03T14:30:00"
  },
  {
    "ticketNo": "CS91827364",
    "email": "test@example.com",
    "topic": "訂單與物流",
    "message": "請問訂單什麼時候會出貨？",
    "status": "RESOLVED",
    "createdAt": "2026-09-28T10:05:12"
  }
]
```

欄位同「送出客服單」的回應。

> 順序是**最新送出的在最前面**。
> 沒有送過任何客服單時，回空陣列 `[]`。

### Response — 失敗

| 狀態碼 | 情況 | `message` |
|---|---|---|
| 401 | 資料庫找不到目前登入的會員 | `登入過期或失效` |

### 過程中做了什麼

```
前端 GET /api/support-tickets
   │
   ▼
① SupportTicketService.getMyTickets()
   ├─ CurrentMember.require()：查出目前登入的會員
   │    └─ 查不到 → 401「登入過期或失效」
   ├─ 查 support_tickets 裡這個會員的所有客服單，照送出時間，新的在前
   └─ 每一筆轉成 SupportTicketResponse
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`support_tickets` 表，不會寫入任何資料。
