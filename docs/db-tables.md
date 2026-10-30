# 資料表規格整理

依 `src/main/resources/db/migration/V1__init.sql` 整理（不含種子資料）。
資料庫是 SQL Server。這份只用文字描述每個欄位需要的特性，用來對照著思考要怎麼寫建表語法。

## 用詞說明

| 用詞 | 意思 |
|---|---|
| 主鍵 | 每筆資料的身分證，不可重複、不可空 |
| 自動編號 | 新增時資料庫自己產生號碼，從 1 開始每次加 1 |
| 必填 / 可空 | 能不能沒有值 |
| 唯一 | 整張表裡不能出現兩筆一樣的值 |
| 唯一（只看有值的） | 空值可以有很多筆，有值的才不能重複 |
| 預設值 | 新增時沒給值，自動填入的值 |
| 外鍵 → 某表 | 值必須是某張表裡存在的 id |
| 刪除時一起刪 | 被指到的那筆被刪掉，這筆也跟著刪 |
| 刪除時清成空值 | 被指到的那筆被刪掉，這筆保留，只把這個欄位清空 |
| 刪除時擋下 | 有資料指著它，就不允許刪除被指到的那筆（外鍵沒特別寫時的預設行為） |
| 限制值 | 欄位的值必須符合某個條件 |
| 查詢加速 | 需要額外建一個索引，讓某種查詢變快 |

型態用詞：

| 用詞 | 意思 |
|---|---|
| 大整數 | id 類欄位，範圍很大的整數 |
| 整數 | 一般數字，例如金額、數量 |
| 文字(N) | 可存中文的文字，最多 N 個字 |
| 長文字 | 沒有長度上限的文字 |
| 是/否 | 只有 0 和 1 |
| 日期 | 只有年月日 |
| 日期時間 | 年月日時分秒（大部分欄位只到秒，不存小數） |

---

## 建立順序

外鍵只能指向「已經存在」的表，所以要照這個順序建：

1. categories → products → product_variants
2. styles → product_styles → style_aliases → style_relations
3. members → member_profiles → cart_items → wishlist_items → member_product_views
4. staff
5. inventory_transactions → inventory_transaction_items
6. coupons → member_coupons → coupon_schedules → coupon_schedule_members
7. orders → order_items
8. **回頭補上 member_coupons 指向 orders 的外鍵**（member_coupons 建立時 orders 還不存在）
9. payments
10. support_tickets

---

# 一、商品相關

## categories（分類）

主分類和副分類放在同一張表，用 parent_id 分層。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| parent_id | 大整數 | 可空 | 外鍵 → categories 自己（刪除時擋下） | 空 = 主分類；有值 = 副分類，指向所屬主分類 |
| name | 文字(50) | 必填 | | 顯示名稱，例如 女裝、外套類 |
| code | 文字(100) | 可空 | 唯一（只看有值的） | 固定代碼，用 Uniqlo 的分類代碼，例如 all_men。各電腦的 id 可能不同，code 不會變 |
| icon_url | 文字(500) | 可空 | | 分類小圖示路徑；目前只有第 2 層有 |

思考點：
- 外鍵指向自己這張表
- code 會有很多筆空值，所以不能用一般的唯一約束（SQL Server 一般唯一只允許一筆空值）

---

## products（商品）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| slug | 文字(100) | 必填 | 唯一 | 網址用的字串 id，例如 kids-1sam-0 |
| category_id | 大整數 | 必填 | 外鍵 → categories（刪除時擋下） | 所屬分類 |
| name | 文字(200) | 必填 | | 商品名稱，關鍵字搜尋會用 |
| description | 長文字 | 可空 | | 商品描述 |
| price | 整數 | 必填 | | 售價 |
| orig_price | 整數 | 可空 | | 原價；有值且大於 price 就顯示特價 |
| is_new | 是/否 | 必填 | 預設值 0 | 新品標籤 |
| is_hot | 是/否 | 必填 | 預設值 0 | 人工設定的熱門 |
| status | 文字(20) | 必填 | 預設值 ON_SALE | ON_SALE（上架中）/ OFF_SHELF（已下架） |
| image_url | 文字(500) | 可空 | | 商品主圖，列表、追蹤清單、購物車用 |
| scheduled_off_at | 日期時間（含小數秒） | 可空 | | 自動下架時間；空 = 不自動下架 |

查詢加速：
- category_id：列出某分類的商品
- status + scheduled_off_at，**只收 scheduled_off_at 有值的資料**：排程每分鐘查「上架中、而且下架時間到了」的商品

---

## product_variants（SKU：顏色 × 尺寸）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| product_id | 大整數 | 必填 | 外鍵 → products（刪除時一起刪） | 屬於哪件商品 |
| color | 文字(30) | 必填 | | 白、黑、藏青… |
| size | 文字(20) | 必填 | | S、M、110cm… |
| sku_code | 文字(50) | 必填 | 唯一 | 貨號 |
| stock | 整數 | 必填 | | 這個組合的庫存 |
| published_at | 日期時間 | 必填 | 預設值 = 新增當下 | |
| url | 文字(500) | 必填 | | 這個顏色的圖片路徑 |

表層規則：
- **product_id + color + size 組合唯一**：同一件商品不能有兩個一樣的「顏色 + 尺寸」

---

# 二、商品風格

## styles（風格）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| code | 文字(50) | 必填 | 唯一 | 固定英文代碼，例如 japanese；程式和 SQL 用它找風格 |
| name | 文字(50) | 必填 | 唯一 | 前台顯示名稱，例如 日系；可改名 |

---

## product_styles（商品 ↔ 風格，多對多）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| product_id | 大整數 | 必填 | 外鍵 → products（刪除時一起刪） | |
| style_id | 大整數 | 必填 | 外鍵 → styles（刪除時擋下） | |

表層規則：
- **主鍵 = product_id + style_id 兩個欄位合起來**（沒有獨立的 id 欄位）：同一件商品不能重複貼同一個風格

查詢加速：
- style_id + product_id：從風格反查商品（主鍵是 product_id 在前，反過來查需要另一個索引）

---

## style_aliases（風格同義詞）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| style_id | 大整數 | 必填 | 外鍵 → styles（刪除時一起刪） | 對應的正式風格 |
| alias | 文字(50) | 必填 | 限制值：去掉前後空白後不能是空字串 | 搜尋用的同義詞，例如 日式 → 日系 |

表層規則：
- **主鍵 = style_id + alias 兩個欄位合起來**：同一個風格不能有重複的別名，但同一個別名可以對應到不同風格

查詢加速：
- alias + style_id：用別名找風格

---

## style_relations（相關風格，單向）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| source_style_id | 大整數 | 必填 | 外鍵 → styles（刪除時擋下） | 搜尋到的風格 |
| target_style_id | 大整數 | 必填 | 外鍵 → styles（刪除時擋下） | 要一起補充的相關風格 |
| weight | 整數 | 必填 | 限制值：1 到 100 | 相關程度；目前程式還沒用到 |

表層規則：
- **主鍵 = source_style_id + target_style_id 兩個欄位合起來**
- **限制值：source 和 target 不能相同**（比較兩個欄位，只能寫在表層）
- 單向：A → B 和 B → A 要各存一筆

查詢加速：
- target_style_id：外鍵檢查和反查用

---

# 三、會員相關

## members（會員帳號）

只能用 Google（Firebase）登入，所以沒有密碼欄位。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| email | 文字(255) | 必填 | 唯一 | 登入帳號，存小寫 |
| status | 文字(20) | 必填 | 預設值 ACTIVE | ACTIVE / DISABLED |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |
| firebase_uid | 文字(128) | 可空 | 唯一（只看有值的） | Google 帳號的唯一 id；假會員沒有 |

---

## member_profiles（會員個人資料，一對一）

第一次登入只建 members，補填資料後才建這筆。「有沒有這筆」= 「資料補齊了沒」。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| member_id | 大整數 | 必填 | **主鍵，同時也是外鍵** → members（刪除時一起刪） | 不自動編號，直接用會員的 id |
| name | 文字(50) | 必填 | | |
| phone | 文字(20) | 必填 | | |
| gender | 文字(10) | 必填 | | male / female |
| birthday | 日期 | 必填 | | 只要年月日 |
| address | 文字(255) | 可空 | | 結帳時當宅配地址的預設值 |

---

## cart_items（購物車）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| member_id | 大整數 | 必填 | 外鍵 → members（刪除時一起刪） | |
| variant_id | 大整數 | 必填 | 外鍵 → product_variants（刪除時一起刪） | 放進購物車的是 SKU |
| qty | 整數 | 必填 | | 數量 |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |

表層規則：
- **member_id + variant_id 組合唯一**：同一個會員的同一個 SKU 只能有一筆，再加入就改數量

---

## wishlist_items（追蹤清單）

追蹤的是「商品」，不是 SKU。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| member_id | 大整數 | 必填 | 外鍵 → members（刪除時一起刪） | |
| product_id | 大整數 | 必填 | 外鍵 → products（刪除時一起刪） | |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |

表層規則：
- **member_id + product_id 組合唯一**

---

## member_product_views（會員瀏覽紀錄）

一個會員看同一件商品只有一筆，用 view_count 累加次數（30 分鐘內重複看不加）。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| member_id | 大整數 | 必填 | 外鍵 → members（刪除時一起刪） | |
| product_id | 大整數 | 必填 | 外鍵 → products（刪除時一起刪） | |
| view_count | 整數 | 必填 | 預設值 1 | 累積瀏覽次數 |
| first_viewed_at | 日期時間 | 必填 | 預設值 = 新增當下 | 第一次看的時間 |
| last_viewed_at | 日期時間 | 必填 | 預設值 = 新增當下 | 最後一次看的時間 |

表層規則：
- **member_id + product_id 組合唯一**

查詢加速：
- member_id + last_viewed_at（新的在前）：查會員最近看過什麼、算風格偏好
- product_id + view_count（多的在前）：算商品瀏覽熱度

---

# 四、後台員工

## staff（員工帳號）

跟前台會員完全分開。一個員工只屬於一個部門；部門對應的權限寫在 Java，不存資料庫。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| account | 文字(50) | 必填 | 唯一 | 登入帳號，例如 sys01；建立後不能改 |
| password_hash | 文字(255) | 必填 | | BCrypt 雜湊，絕對不存明碼 |
| name | 文字(50) | 必填 | | |
| status | 文字(20) | 必填 | 預設值 ACTIVE | ACTIVE / DISABLED |
| last_login_at | 日期時間 | 可空 | | 還沒登入過是空的 |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |
| department | 文字(20) | 必填 | | PRODUCT / ORDER / CS / MKT / ADMIN（ADMIN 可以進所有部門） |

---

# 五、庫存異動

## inventory_transactions（庫存異動單頭）

一次進貨或調整操作一筆。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| type | 文字(20) | 必填 | 限制值：只能是 RECEIVE 或 ADJUSTMENT | RECEIVE = 進貨入庫；ADJUSTMENT = 手動調整 |
| note | 文字(255) | 可空 | | 備註 |
| staff_id | 大整數 | 必填 | 外鍵 → staff（刪除時擋下） | 操作的員工 |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |

查詢加速：
- created_at（新的在前）：後台列表最新的排前面
- staff_id：查某員工的操作紀錄、外鍵檢查

---

## inventory_transaction_items（庫存異動單身）

這次操作裡每個 SKU 的變化。商品資訊存**快照**，商品之後改名或刪除，紀錄都不受影響。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| transaction_id | 大整數 | 必填 | 外鍵 → inventory_transactions（刪除時一起刪） | 屬於哪張單頭 |
| variant_id | 大整數 | 可空 | 外鍵 → product_variants（刪除時清成空值） | 反查用；SKU 刪掉後紀錄照樣保留 |
| sku_code | 文字(50) | 必填 | | 快照 |
| product_name | 文字(200) | 必填 | | 快照 |
| color | 文字(30) | 必填 | | 快照 |
| size | 文字(20) | 必填 | | 快照 |
| quantity_change | 整數 | 必填 | 限制值：不能是 0 | 變化量，正數 = 增加，負數 = 減少 |
| stock_before | 整數 | 必填 | 限制值：大於等於 0 | 異動前庫存 |
| stock_after | 整數 | 必填 | 限制值：大於等於 0 | 異動後庫存 |

思考點：
- variant_id 要「刪除時清成空值」，所以這個欄位**一定要允許空值**

查詢加速：
- transaction_id：查某張單頭的明細
- variant_id：查某個 SKU 的異動歷史

---

# 六、折價券

## coupons（折價券範本）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| code | 文字(30) | 必填 | 唯一 | 券代碼，例如 WELCOME100，存大寫 |
| title | 文字(100) | 必填 | | 顯示名稱，例如 新會員購物金 |
| type | 文字(20) | 必填 | | AMOUNT（折固定金額）/ PERCENT（打折） |
| value | 整數 | 必填 | | AMOUNT → 折多少元；PERCENT → 折幾 %（10 = 9 折） |
| min_subtotal | 整數 | 必填 | | 消費門檻 |
| valid_days | 整數 | 必填 | | 領取後幾天內有效 |
| is_active | 是/否 | 必填 | 預設值 1 | 可不可以領取 |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |
| auto_trigger | 文字(20) | 可空 | | 自動發送時機：BIRTHDAY；空 = 只能手動發 |

---

## member_coupons（會員持有的券）

同一張券可以重複領，每領一次存一筆，所以**沒有**「會員 + 券」的組合唯一。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| member_id | 大整數 | 必填 | 外鍵 → members（刪除時一起刪） | |
| coupon_id | 大整數 | 必填 | 外鍵 → coupons（刪除時擋下） | |
| expire_at | 日期時間 | 必填 | | 領取時算好：領取時間 + valid_days |
| used_at | 日期時間 | 可空 | | 空 = 未使用 |
| order_id | 大整數 | 可空 | 外鍵 → orders（刪除時清成空值）**要等 orders 建好後才補** | 用在哪張訂單 |
| received_at | 日期時間 | 必填 | 預設值 = 新增當下 | 領取時間 |
| source | 文字(20) | 必填 | 預設值 MANUAL | 這張券怎麼來的：MANUAL / BIRTHDAY |

思考點：
- 這張表指向 orders，orders 也指向這張表（orders.member_coupon_id），互相參照。所以要先建這張表、不加 order_id 的外鍵，等 orders 建好再回頭補

查詢加速：
- member_id：查「我的折價券」
- received_at：發券紀錄頁依日期篩選、排序

---

## coupon_schedules（預約發券）

立即發送不存這裡，直接寫進 member_coupons。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| coupon_id | 大整數 | 必填 | 外鍵 → coupons（刪除時擋下） | 要發哪張券 |
| target_all | 是/否 | 必填 | | 1 = 發給全部會員；0 = 看 coupon_schedule_members |
| scheduled_at | 日期時間 | 必填 | | 預約時間 |
| status | 文字(20) | 必填 | 預設值 PENDING | PENDING / SENT / FAILED / CANCELLED |
| sent_at | 日期時間 | 可空 | | 實際發出時間 |
| sent_count | 整數 | 可空 | | 實際發了幾位 |
| created_by | 大整數 | 必填 | 外鍵 → staff（刪除時擋下） | 建立預約的員工 |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |

查詢加速：
- status + scheduled_at：排程每分鐘查「等待中、而且時間到了」的預約

---

## coupon_schedule_members（預約要發給哪些會員）

target_all = 1 的預約，這裡沒有資料。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| schedule_id | 大整數 | 必填 | 外鍵 → coupon_schedules（刪除時一起刪） | |
| member_id | 大整數 | 必填 | 外鍵 → members（刪除時一起刪） | |

表層規則：
- **主鍵 = schedule_id + member_id 兩個欄位合起來**

---

# 七、訂單

## orders（訂單主檔）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| order_no | 文字(30) | 必填 | 唯一 | 訂單編號，例如 UC20260901-8842 |
| member_id | 大整數 | 必填 | 外鍵 → members（刪除時擋下） | 有訂單的會員不能直接刪 |
| status | 文字(20) | 必填 | 預設值 PENDING | Java 裡的值：UNPAID / PENDING / SHIPPED / DELIVERED / PICKED_UP / CANCELLED |
| receiver_name | 文字(50) | 必填 | | 收件人 |
| receiver_phone | 文字(20) | 必填 | | |
| receiver_email | 文字(255) | 可空 | | 寄訂單通知用；新訂單由程式擋空值 |
| shipping_method | 文字(20) | 必填 | | HOME（宅配）/ CVS（超商） |
| shipping_address | 文字(255) | 必填 | | 宅配地址或超商門市名 |
| payment_method | 文字(20) | 必填 | | CREDIT / ATM / COD |
| note | 文字(255) | 可空 | | 結帳時的備註 |
| subtotal | 整數 | 必填 | | 商品小計 |
| discount | 整數 | 必填 | 預設值 0 | 折價券折抵 |
| shipping_fee | 整數 | 必填 | 預設值 50 | 運費（滿 1490 免運） |
| total | 整數 | 必填 | | 實付 = subtotal − discount + shipping_fee |
| member_coupon_id | 大整數 | 可空 | 外鍵 → member_coupons（刪除時擋下） | 用了哪張券 |
| paid_at | 日期時間 | 可空 | | 付款時間 |
| shipped_at | 日期時間 | 可空 | | 出貨時間 |
| completed_at | 日期時間 | 可空 | | 完成時間 |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | 下單時間 |
| shipping_carrier | 文字(50) | 可空 | | 物流業者；出貨時才填 |
| tracking_number | 文字(100) | 可空 | | 物流單號；出貨時才填 |
| delivered_at | 日期時間（含小數秒） | 可空 | | 送達時間 |

思考點：
- 「之後才會發生的事」（付款、出貨、送達、物流資訊）都允許空值
- 建表語法裡 status 的註解沒寫到 UNPAID，但 Java 的 OrderStatus 有這個值

查詢加速：
- member_id + created_at（新的在前）：會員的訂單列表
- status + created_at（新的在前）：後台依狀態篩選訂單、排程找逾時未付款

---

## order_items（訂單明細）

商品資訊存**快照**，商品之後改價、改名或刪除，訂單都不受影響。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| order_id | 大整數 | 必填 | 外鍵 → orders（刪除時一起刪） | |
| variant_id | 大整數 | 可空 | 外鍵 → product_variants（刪除時清成空值） | 反查用 |
| product_name | 文字(200) | 必填 | | 快照 |
| color | 文字(30) | 必填 | | 快照 |
| size | 文字(20) | 必填 | | 快照 |
| image_url | 文字(500) | 可空 | | 快照 |
| unit_price | 整數 | 必填 | | 下單當時的單價 |
| qty | 整數 | 必填 | | 數量 |
| total_price | 整數 | 必填 | | unit_price × qty，存起來方便做報表 |

查詢加速：
- order_id：查某張訂單的明細

---

## payments（綠界付款紀錄）

每一筆代表一次付款嘗試，一張訂單可能有多筆（例如第一次失敗、第二次成功）。

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| order_id | 大整數 | 必填 | 外鍵 → orders（刪除時擋下） | |
| merchant_trade_no | 文字(20) | 必填 | 唯一 | 傳給綠界的交易編號 |
| ecpay_trade_no | 文字(30) | 可空 | | 綠界付款完成後回傳的編號 |
| amount | 整數 | 必填 | 限制值：大於等於 0 | 付款金額（新台幣元） |
| payment_method | 文字(20) | 必填 | | CREDIT / ATM（貨到付款不經過綠界） |
| status | 文字(20) | 必填 | 預設值 PENDING | PENDING / PAID / FAILED / CANCELLED |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |
| paid_at | 日期時間 | 可空 | | 付款完成時間 |

查詢加速：
- order_id：查某張訂單的付款紀錄
- status：依付款狀態查詢

---

# 八、客服

## support_tickets（客服單）

| 欄位 | 型態 | 必填 | 特性 | 說明 |
|---|---|---|---|---|
| id | 大整數 | 必填 | 主鍵、自動編號 | |
| ticket_no | 文字(30) | 必填 | 唯一 | 客服單編號，例如 CS12345678 |
| member_id | 大整數 | 可空 | 外鍵 → members（刪除時清成空值） | 沒登入也能送，所以可空 |
| email | 文字(255) | 必填 | | 回覆用 |
| topic | 文字(50) | 必填 | | 訂單與物流 / 退換貨 / 商品諮詢 / 付款與發票 / 折價券與活動 / 會員帳號問題 / 其他 |
| message | 文字(2000) | 必填 | | 最多 2000 字，跟 Java 的驗證一致 |
| status | 文字(20) | 必填 | 預設值 IN_PROGRESS | IN_PROGRESS / RESOLVED |
| created_at | 日期時間 | 必填 | 預設值 = 新增當下 | |
| reply | 文字(2000) | 可空 | | 客服回覆內容 |
| replied_at | 日期時間（含小數秒） | 可空 | | 回覆時間 |
| resolved_at | 日期時間（含小數秒） | 可空 | | 結案時間 |

查詢加速：
- status + created_at（新的在前）：後台依狀態列出客服單
