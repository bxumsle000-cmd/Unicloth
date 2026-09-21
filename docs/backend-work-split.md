# 後端分工規劃

依目前資料庫（10 張表、5 個區塊）規劃後端分工。
## 模組劃分

| 模組 | 資料表 | 主要功能 | 難度 |
|---|---|---|---|
| **商品** | `categories`、`products`、`product_variants` | 商品列表、分類篩選、關鍵字搜尋、商品詳情、後台上下架 | ★★ |
| **會員** | `members` | 註冊、登入、登出、修改資料、Session / 登入狀態 | ★★★ |
| **購物車 + 追蹤清單** | `cart_items`、`wishlist_items` | 加入 / 移除 / 改數量 | ★★ |
| **訂單** | `orders`、`order_items` | 結帳（購物車 → 訂單）、扣庫存、訂單查詢、訂單狀態 | ★★★★ |
| **折價券** | `coupons`、`member_coupons` | 領券、註冊送券、結帳套用、計算折抵 | ★★★ |
| **客服** | `support_tickets` | 送出客服單、後台查看 / 改狀態 | ★ |



分配注意：
- **訂單最重**：要跟購物車、庫存、折價券三邊互動，還有交易一致性問題，給最有把握的人。
- **客服最輕**：適合當「附加」項目。

## 分工前一定要先講好的事

### 1. 套件結構

建議依模組分 package，各自在自己的資料夾內動作，減少 Git 衝突：

```
com.EEIT25.unicloth
├── product/    (Product, ProductRepository, ProductService, ProductController)
├── member/
├── cart/
├── order/
├── coupon/
└── support/
```

> 目前是 `entity/`、`repository/` 這種依分層分的，可討論要不要調整；不改也行，但衝突機率會高一點。

### 2. 會員模組先跑第一棒

購物車、訂單、折價券、追蹤清單全都需要「現在登入的是誰」。

- 先約好取得登入會員的方式（例如從 Session 拿 `memberId`）。
- 會員做完之前，其他人先用寫死的 `memberId = 1` 開發。

### 3. API 回傳格式統一

先定好共用的回應格式，前端才不用對每個人寫不同的解析。例如：

```json
{ "success": true,  "data": { ... } }
{ "success": false, "message": "庫存不足" }
```

### 4. 模組之間的介面

跨模組只透過對方的 **Service**，不要直接用別人的 Repository。

例：訂單要扣庫存 → 呼叫 `ProductService.deductStock(variantId, qty)`，由商品負責人提供這個方法。

### 5. Git 流程

- 一人一個分支：`feature/product`、`feature/order`…
- 做完發 PR 合回 `main`，不要直接推 `main`。

## 提醒

「先各做各的，最後再串」最容易翻車。建議：

- 每週至少合併一次到 `main`。
- 大家都要能把 `main` 跑起來，串接問題早發現早解決。
