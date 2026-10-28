# 銷售數據規劃：後台 vs GA4

分工原則：**跟錢、訂單有關的數字，後台從資料庫算；使用者在網站上的行為，交給 GA4。**

前端範例（假資料）：
- 營收總覽：`sample/sales-overview.html`
- 商品銷售：`sample/product-sales.html`（商品資料在 `sample/data/products.js`）
- 訂單結構：`sample/order-structure.html`
- 會員與顧客：`sample/member-customers.html`
- 折價券成效：`sample/coupon-performance.html`
- 活動成效：`sample/campaign-performance.html`（特價活動假設後端已經改好，見「要改後端的部分：特價活動」）

---

## 一、後台自己做（資料庫）

> 營收只算有效訂單：排除 `UNPAID`（未付款）、`CANCELLED`（已取消）。

### 1. 營收總覽

資料來源：`orders`、`order_items`

- 營業額、客單價、銷售件數
  - 訂單數不顯示，但客單價 = 營業額 ÷ 訂單數，後端還是要算
- 折扣總額：`SUM(orders.discount)`，**只有折價券折掉的錢**，不含活動特價（見下方「要改後端的部分：特價活動」）
- 運費收入、免運訂單佔比（`shipping_fee = 0`）
- 趨勢圖：依日、週、月
- 期間比較：本期對上一期
- 匯出 Excel：自己選開始、結束日期，每天一列（日期、營業額、客單價、銷售件數、折扣總額）
  - Python 可以用 pandas 的 `df.to_excel()` 產生檔案

### 2. 商品銷售

資料來源：`order_items` → `product_variants` → `products` → `categories`

- 熱銷排行 Top 10：可以依件數或金額排
- 依分類統計：主分類、副分類
- 依顏色、尺寸統計（`order_items` 有 color、size 快照）
- 滯銷商品：上架中（`ON_SALE`），但一段期間內沒有賣出

### 3. 訂單結構

資料來源：`orders`

依下單時間 `created_at` 決定屬於哪個期間。

- 配送方式佔比：HOME / CVS（只算有效訂單）；**點長條可以篩選整頁**（篩選在前端做）
- 付款方式佔比：CREDIT / ATM / COD（只算有效訂單）
- 訂單狀態分布（全部訂單，照流程排序）
  - 宅配：`SHIPPED` → `DELIVERED`；超商：`SHIPPED` → `DELIVERED`（到店）→ `PICKED_UP`（取貨完畢）
  - 目前沒有程式會把訂單改成 `PICKED_UP`，**要先改後端**，見下方「要改後端的部分：超商取貨完畢」
- 取消率：已取消 ÷ 下單數，依付款方式、取消原因分開算
  - 信用卡、ATM：未付款取消（信用卡 30 分鐘、ATM 4 天，`OrderTimeoutScheduler`）
  - 貨到付款：超商未取貨、宅配拒收。**要先改後端**，見下方「要改後端的部分：貨到付款未取貨」
  - 目前沒有記錄取消時間（沒有 `cancelled_at` 欄位）
- 出貨速度：出貨時間 - 訂單成立時間
  - 訂單成立：信用卡、ATM 用 `paid_at`；貨到付款用 `created_at`（貨到付款的 `paid_at` 是送達收錢的時間，不是訂單成立）
  - 顯示平均天數和天數分布（當天、1 天……5 天以上）
- 待出貨超過 3 天：目前狀態是 `PENDING`、成立超過 3 天的訂單數（不受期間影響）
- 配送天數：
  - 宅配：出貨 → 送達（`delivered_at - shipped_at`）
  - 超商：出貨 → 到店（`delivered_at - shipped_at`）、到店 → 取貨（`completed_at - delivered_at`）

### 4. 會員與顧客

資料來源：`members`、`member_profiles`、`orders`

- 性別、年齡層的消費分布（年齡由 `birthday` 換算成今天的年齡）
  - SQL Server 的 `DATEDIFF(YEAR, birthday, GETDATE())` 只是年份相減，還沒過生日也會多 1 歲，要自己判斷
  - 沒補填資料的會員（沒有 `member_profiles`）不能結帳，所以下單的人一定有性別、生日
- 新客和回購客的比例（只看這段期間有下單的會員）
  - 新客：第一筆有效訂單在這段期間內；回購客：這段期間之前就有有效訂單
  - 第一筆訂單的時間要用全部訂單算，不能只看期間內的訂單
- 消費金額 Top 10 會員
- 每月新註冊會員數（`members.created_at`）

### 5. 折價券成效

資料來源：`member_coupons`、`coupons`、`promotions`、`promotion_products`、`orders`、`order_items`

優惠分兩種：折價券、特價活動。

- 優惠總額 = 折價券折扣（`SUM(orders.discount)`）+ 活動特價讓利

**折價券**

- 使用率：已使用 ÷ 已發出（`used_at IS NOT NULL`）
  - 依發券時間 `received_at` 決定屬於哪個期間（這段期間發出的券，現在用掉幾張）
  - 訂單取消時 `OrderService.cancelOrder()` 會把券還回去（`used_at` 清成 NULL），所以已取消的訂單不算用過
  - 等付款（`UNPAID`）的訂單 `used_at` 有值，算已使用，但不算進訂單數、營業額
  - 最近發的券還在有效期間內，使用率會偏低，所以也顯示可使用、已過期的張數
- 每張券帶來的訂單數、營業額、折扣成本
  - 依下單時間 `created_at`，只算有效訂單；折扣成本加總起來等於營收總覽的折扣總額
- 有用券和沒用券的訂單，客單價差多少
  - 券有消費門檻，有用券的訂單本來就比較大，差距不全是券的功勞

**活動特價**

- 活動特價讓利：`SUM((orig_price - unit_price) * qty)`，只算 `promotion_id IS NOT NULL` 的明細；每個活動的成效在「6. 活動成效」

### 6. 活動成效

資料來源：`promotions`、`promotion_products`、`orders`、`order_items`（要先改後端，見下方「要改後端的部分：特價活動」）

- 特價銷售件數、金額、平均折數：依下單時間 `created_at`，只算有效訂單；特價明細 = `promotion_id IS NOT NULL`
  - 平均折數：特價明細的 `SUM(unit_price * qty) ÷ SUM(orig_price * qty)`
- 每個活動的成效：列出跟期間重疊的活動，數字算整個活動（`start_at` ～ `end_at`，進行中的算到昨天）
  - 特價銷售件數、金額、讓利
  - 活動商品日均金額：活動前 30 天 → 活動中
  - 全站日均營業額：活動前 30 天 → 活動中（同時有其他活動或折價券時，不全是這個活動的功勞）
- 點一個活動，看各商品類別的成效：件數、金額、讓利、日均件數和日均金額（活動前 → 活動中）
  - 類別用主分類 + 副分類（副分類名稱會重複，例如男裝、女裝都有外套類）；只算參加活動的商品
  - 活動前：參加活動的商品 `promotion_id IS NULL` 的明細；要另外查期間之前的資料
  - 件數變多、金額變少，代表降價的損失沒有被銷量補回來
  - 認同一件商品要用 `variant_id` 接回 `product_id`，**不能用 `product_name`**（商品名稱有重複，例如男裝、女裝都有「繭型牛仔褲」）；SKU 被刪掉時接不回來

### 7. 購買意向（簡單版）

資料來源：`cart_items`、`wishlist_items`

- 目前被追蹤最多的商品
- 目前在購物車裡最多的商品

> GA4 也能做購買意向，但這兩張表已經有現成的資料，後台可以先做一個簡單版。

### 資料庫目前做不到的

- **毛利、利潤**：沒有成本欄位。
- **轉換率、瀏覽數**：沒有記錄瀏覽紀錄或流量，改由 GA4 負責。
- **退貨、退款統計**：目前沒有退貨或退款的流程。
- **商品被刪除後的分類統計**：`order_items` 沒存 product_id 和分類。SKU 被刪除時 `variant_id` 會變成 NULL，就查不到分類。

### 要改後端的部分：特價活動

**問題**：

- 現在特價是直接改商品的 `products.price`（售價）和 `orig_price`（原價），沒有「活動」的概念，看不出特價什麼時候開始、結束，也沒辦法算一整波活動的成效。
- 結帳時 `order_items` 只存 `unit_price`，沒存當時的原價、也沒存是哪個活動，事後算不出讓利。

**改成**：特價都要透過「活動」設定。活動有開始、結束時間，時間內參加的商品用活動特價，時間外用原價。

1. **新增 migration**（`V14__create_promotions.sql`）

   ```sql
   -- 特價活動；活動期間 start_at <= 現在 < end_at
   CREATE TABLE promotions (
       id         BIGINT IDENTITY(1,1) NOT NULL,
       name       NVARCHAR(100) NOT NULL,        -- 秋季特賣
       start_at   DATETIME2(0)  NOT NULL,
       end_at     DATETIME2(0)  NOT NULL,        -- 結束日的隔天 00:00
       created_by BIGINT        NULL,            -- 建立的員工；NULL = migration 轉過來的
       created_at DATETIME2(0)  NOT NULL CONSTRAINT df_promotions_created_at DEFAULT SYSDATETIME(),
       CONSTRAINT pk_promotions PRIMARY KEY (id),
       CONSTRAINT fk_promotions_staff FOREIGN KEY (created_by) REFERENCES staff (id)
   );

   -- 活動商品：哪個活動、哪件商品、特價多少
   CREATE TABLE promotion_products (
       promotion_id BIGINT NOT NULL,
       product_id   BIGINT NOT NULL,
       sale_price   INT    NOT NULL,             -- 活動特價，要小於 products.price
       CONSTRAINT pk_promotion_products PRIMARY KEY (promotion_id, product_id),
       CONSTRAINT fk_pp_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE CASCADE,
       CONSTRAINT fk_pp_product FOREIGN KEY (product_id) REFERENCES products (id)
   );
   -- 查「這件商品現在有沒有在活動裡」用
   CREATE INDEX idx_promotion_products_product ON promotion_products (product_id);

   -- 訂單明細多存原價和活動；NULL = 下單時沒有特價
   ALTER TABLE order_items ADD orig_price INT NULL;
   ALTER TABLE order_items ADD promotion_id BIGINT NULL
       CONSTRAINT fk_order_items_promotion REFERENCES promotions (id);
   ```

   **現有的特價要搬過去**（同一個 migration）：
   - 有 `orig_price > price` 的商品，建一個活動（例如「既有特價」），`sale_price` = 現在的 `price`。活動結束時間**要決定**。
   - 把這些商品的 `price` 改成 `orig_price`（`products.price` 從此代表原價）。
   - 刪掉 `products.orig_price` 欄位。
   - 舊訂單沒有 `orig_price`、`promotion_id`，只能從改完之後開始統計。

2. **規則**（**要再討論決定**）
   - 售價：商品在進行中的活動裡 → `sale_price`；否則 → `products.price`。每次查價格時看時間就好，**不用排程切換價格**。
   - 同一件商品不能同時在兩個時間重疊的活動裡（新增、修改活動時檢查）。
   - `sale_price` 要小於 `products.price`；活動進行中改原價時，也要檢查不能低於特價。
   - 已經開始的活動不能刪、不能改商品和特價（已經有訂單用了）；可以提前結束（`end_at` 改成現在）。還沒開始的可以改、可以刪。

3. **後端程式**
   - 新增 `Promotion`、`PromotionProduct` entity 和 repository；repository 要能一次查一批商品現在的活動特價。
   - 新增一個算「現在售價」的 service（名稱實作時再取），所有顯示價格的地方都用它：
     - 前台 DTO：`ProductCardResponse`、`ProductDetailResponse`、`CartItemResponse`、`WishlistItemResponse`
     - JSON 欄位維持 `price`（現在賣多少）、`origPrice`（活動中才有值，= 原價），**前端不用改**
   - `ProductRepository` 的價格篩選（`minPrice`、`maxPrice`）現在用 `p.price`，要改成用「現在售價」（LEFT JOIN 進行中的活動，`COALESCE(sale_price, price)`）。
   - `CheckoutService`：步驟 3 算小計、步驟 9 存明細都要用「現在售價」，明細多存 `origPrice`、`promotion`：

     ```java
     .unitPrice(currentPrice)                         // 活動中 = sale_price，否則 = price
     .origPrice(promotion != null ? product.getPrice() : null)
     .promotion(promotion)
     ```

   - `OrderItem.java`：加 `origPrice`、`promotion`。
   - 後台商品：`CreateProductRequest`、`UpdateProductRequest`、`AdminProductDetailResponse` 拿掉 `origPrice`，`AdminProductService.validatePrices()` 一起刪；`price` 改叫「原價」。
   - 新增後台活動管理：`AdminPromotionController`，路徑放 `/api/admin/mkt/promotions`（`SecurityConfig` 已經擋 `/api/admin/mkt/**` 給 MKT、ADMIN），可以列表、新增、修改、刪除、提前結束。
   - `DataSeeder`：`products.json` 有 `origPrice` 的商品，`price` 存 `origPrice`，再建一個活動放這些商品的特價。

**改完可以算的**：

- 每個活動的特價銷售件數、金額、讓利
- 活動前後比較（活動商品、全站）
- 每個活動裡每件商品的成效
- 折扣總額可以分成「折價券」和「活動特價」兩項

### 要改後端的部分：貨到付款未取貨

**問題**：貨到付款的訂單目前沒有任何方式會被取消，超商沒取貨或宅配拒收，後台都沒辦法記錄。

- `OrderService.cancelOrder()` 只能取消 `UNPAID` 的訂單，但貨到付款一建立就是 `PENDING`。
- `OrderTimeoutScheduler` 只處理信用卡、ATM。
- 後台訂單 API（`AdminOrderController`）只有查詢、出貨（`/ship`）、確認送達（`/deliver`），沒有取消。
- 貨到付款收到錢時沒有寫 `paid_at`，資料庫看不出到底有沒有收到錢。

**建議做法**（規則要再討論決定）：

1. **沿用 `CANCELLED`，不新增狀態**
   - 貨到付款不會有「未付款取消」，所以 `payment_method = 'COD'` 而且 `status = 'CANCELLED'`，就一定是未取貨或拒收。
   - 超商未取貨、宅配拒收用 `shipping_method`（CVS / HOME）就分得出來。

2. **新增 migration**：`orders` 加取消時間（檔名的版本號看實作順序，例如 `V15__add_order_cancelled_at.sql`）

   ```sql
   -- 訂單被取消的時間；未付款取消、未取貨取消都寫
   ALTER TABLE orders ADD cancelled_at DATETIME2(0) NULL;
   ```

   `OrderService.cancelOrder()` 取消時也一起寫入 `cancelled_at`。

3. **後台加一個操作**：`AdminOrderController` 加 `PATCH /api/admin/order/orders/{orderId}/cancel-undelivered`
   - 只有「貨到付款」而且狀態是「已出貨」（`SHIPPED`）的訂單可以用。
   - 訂單物流部在商品退回倉庫後按下。

4. **`AdminOrderService` 加對應的方法**：
   - 庫存加回去：跟 `cancelOrder()` 一樣用 `productVariantRepository.restoreStock()`。
   - 折價券要不要還給顧客：要決定。
   - 狀態改成 `CANCELLED`，寫入 `cancelled_at`。

5. **貨到付款收到錢時寫入 `paid_at`**：
   - 宅配：`AdminOrderService.markDelivered()` 送達時寫入。
   - 超商：取貨完畢時寫入（見下一節「超商取貨完畢」）。

**改完可以算的**：

- 貨到付款的未取貨率、拒收率（超商、宅配分開）
- 從出貨到被取消花了幾天（`cancelled_at - shipped_at`）
- 貨到付款實際收到的金額

### 要改後端的部分：超商取貨完畢

**問題**：`OrderStatus` 有 `PICKED_UP`（取貨完畢）、`orders` 也有 `completed_at` 欄位，但目前沒有任何程式會用到。超商取貨的訂單到店後就停在 `DELIVERED`，看不出顧客到底取貨了沒。

**建議做法**（規則要再討論決定）：

1. **狀態的意思**：
   - 宅配：`DELIVERED` = 送到顧客手上，流程結束。
   - 超商：`DELIVERED` = 到店、等顧客取貨；`PICKED_UP` = 顧客取貨了，流程結束。

2. **後台加一個操作**：`AdminOrderController` 加 `PATCH /api/admin/order/orders/{orderId}/pickup`
   - 只有「超商取貨」而且狀態是 `DELIVERED` 的訂單可以用。
   - 先由訂單物流部手動按；之後如果有串物流商的通知，再改成自動。

3. **`AdminOrderService` 加對應的方法**：
   - 狀態改成 `PICKED_UP`，寫入 `completed_at`。
   - 貨到付款的話，同時寫入 `paid_at`（取貨時收錢）。

**改完可以算的**：

- 訂單狀態分布有「取貨完畢」
- 到店後平均幾天取貨（`completed_at - delivered_at`）
- 還在店裡、還沒取貨的訂單數（`shipping_method = 'CVS' AND status = 'DELIVERED'`）

---

## 二、GA4 要做的

### 1. 前端要送的事件

| 事件 | 什麼時候送 | 要帶的資料 |
|---|---|---|
| `page_view` | 每頁（裝好追蹤碼就會自動送） | — |
| `view_item_list` | 看商品列表、分類頁 | 列表名稱、商品清單 |
| `view_item` | 看商品詳細頁 | 商品、分類、價格 |
| `search` | 站內搜尋 | 關鍵字 |
| `add_to_wishlist` | 加入追蹤 | 商品 |
| `add_to_cart` | 加入購物車 | 商品、顏色尺寸、數量 |
| `remove_from_cart` | 從購物車移除 | 商品、數量 |
| `begin_checkout` | 進入結帳頁 | 購物車商品、金額 |
| `add_shipping_info` | 選配送方式 | 配送方式 |
| `add_payment_info` | 選付款方式 | 付款方式 |
| `purchase` | 下單成功 | 訂單編號、金額、運費、折價券、商品 |
| `sign_up` | 第一次登入、補填資料完成 | — |

送商品資料時，建議都帶同一組欄位：名稱、分類、顏色尺寸、價格、數量。這樣之後各種報表才能用同樣的方式分類。

### 2. GA4 負責的分析

- 瀏覽數、訪客數、停留時間
- 流量來源：Google、FB、IG、直接輸入網址……
- 裝置（手機或電腦）、地區
- 轉換率：訪客裡有多少人下單
- 購物漏斗：看商品 → 加入購物車 → 開始結帳 → 付款，每一步流失多少人
- 商品被看很多、卻很少人買的排行
- 加入購物車很多、實際買得少的商品
- 從購物車移除最多的商品
- 站內搜尋熱門關鍵字

### 3. 要串進後台頁面的話

- 在 Google Cloud 開服務帳戶，並給它 GA4 的讀取權限。
- Python 用 GA4 Data API 抓數據，整理成跟範例頁一樣的格式，交給前端畫圖。
- 如果不想串 API，也可以直接看 GA4 自己的報表。

### 為什麼營收不用 GA4

- 使用者擋追蹤、拒絕 cookie 時不會被記到，數字通常會比實際少。
- ATM、貨到付款之後才付款，取消訂單也要另外通知 GA4，不然數字會對不上。
- 資料有處理延遲（官方說法大約 24～48 小時，待查證）。
- 後台發生的事（出貨、取消、發券），前端不知道，GA4 抓不到。

---

## 注意事項

- GA4 從裝好追蹤碼那天才開始累積資料，以前的資料抓不到。
- 事件名稱是依照 GA4 電商事件整理的；參數的正式名稱，實作時再對照 Google 官方文件確認。
- 銷售數據目前放在行銷部（MKT）的側邊選單底下。
