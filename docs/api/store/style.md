# Style API（風格標籤）

- Controller：`controller/store/StyleController.java`
- Service：`service/shop/StyleService.java`
- 共同前綴：`/api/styles`

| 功能 | Method | 路徑 | 成功狀態碼 | 成功時回什麼 |
|---|---|---|---|---|
| 取得所有風格 | GET | `/api/styles` | 200 | 風格清單 |

**不需要登入**，也**不需要 body**。

---

## 1. 取得所有風格 `GET /api/styles`

### Request

不需要參數。

### Response — 成功 `200 OK`

```json
[
  { "id": 1, "code": "japanese", "name": "日系" },
  { "id": 2, "code": "natural", "name": "自然風" },
  { "id": 3, "code": "minimal", "name": "簡約" }
]
```

（只列出部分風格，實際內容以資料庫為準。）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 風格 id；後台新增、編輯商品時放進 `styleIds` |
| `code` | string | 固定代碼，例：`japanese` |
| `name` | string | 顯示名稱，例：`日系` |

> 沒有特別排序，資料庫裡沒有風格時回空陣列 `[]`。

### Response — 失敗

這支沒有主動丟出的錯誤。

### 過程中做了什麼

```
前端 GET /api/styles
   │
   ▼
① StyleService.getAllStyles()   ← @Transactional(readOnly = true)
   ├─ 查出 styles 表全部的風格
   └─ 每一筆轉成 StyleResponse
   │
   ▼
② 回 200 + JSON 陣列
```

**資料庫影響：** 只有「讀」`styles` 表，不會寫入任何資料。
