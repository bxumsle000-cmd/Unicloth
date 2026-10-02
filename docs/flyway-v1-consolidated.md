# Flyway 整合版 V1（草案）

> **狀態：草案，尚未套用。**
> 這份文件只是「如果要把 V1 ~ V10 合併成一支 V1，內容會長這樣」的參考。
> `src/main/resources/db/migration/` 裡的檔案**完全沒有動**，組員現在照常開發不受影響。

## 1. 為什麼要整合

目前 migration 共 10 支，其中好幾支只是在「修正前面的決定」：

| 原檔案 | 做了什麼 | 整合後的處理 |
|---|---|---|
| V1__init.sql | 建 11 張表 | 作為基底 |
| V2__category_code.sql | `categories` 加 `code` + 條件式唯一索引 | 直接寫進 `CREATE TABLE categories` |
| V3__product_image_url.sql | `products` 加 `image_url`，並回填舊資料 | 欄位寫進建表；回填不需要（新庫沒有舊資料） |
| V4__category_icon_url.sql | `categories` 加 `icon_url`，並回填舊資料 | 欄位寫進建表；回填不需要 |
| V5__seed_member.sql | 測試會員 | 放到檔案最後的「種子資料」區 |
| V6__member_coupons_allow_duplicate.sql | 拿掉 `uk_member_coupons`，補 `idx_member_coupons_member` | 建表時就不建 UNIQUE，直接建索引 |
| V7__seed_coupons.sql | 測試折價券 | 放到「種子資料」區，`type` 直接用大寫 |
| V8__order_receiver_email.sql | `orders` 加 `receiver_email` | 直接寫進 `CREATE TABLE orders` |
| V9__order_status_uppercase.sql | 訂單狀態預設值改 `PENDING`，舊資料轉大寫 | 預設值直接寫 `N'PENDING'`；轉大寫不需要 |
| V10__enum_uppercase.sql | 其他 enum 欄位預設值 / 資料改大寫 | 預設值直接寫大寫；轉大寫不需要 |

整合後只剩一支檔案，新組員看一支就知道整個資料庫長什麼樣子。

## 2. 已驗證的事（事實）

2026-10-02 在本機 `unicloth-db` 容器做過以下驗證：

1. 開一個暫時的空資料庫，執行下方整合版 SQL → **執行成功、沒有錯誤**。
2. 拿它跟目前已跑完 V1 ~ V10 的 `Unicloth` 資料庫比對：
   - 所有欄位（型別、長度、可否 NULL、預設值）
   - 所有 PK / UNIQUE / FK / DEFAULT 約束名稱
   - 所有索引（含 `uk_categories_code` 的 `WHERE code IS NOT NULL` 條件、`idx_orders_member_time` 的 `DESC`）
   - 所有 FK 的 `ON DELETE` 行為
   - 種子資料（測試會員、兩張折價券，含中文欄位）

   **比對結果完全一致（198 行逐行 diff，零差異）**。比完後暫時資料庫已刪除。

因為結構跟現在的資料庫一模一樣，`spring.jpa.hibernate.ddl-auto=validate` 也會照樣通過，Entity 不用改。
（這點是從「結構相同」推論出來的，沒有另外用整合版重啟一次 app 實測。）

## 3. 整合版 `V1__init.sql`

> 每個從後面版本搬進來的地方都有標 `[原 Vx]`，方便對照。
> 欄位順序刻意跟現在的資料庫相同（例如 `products.image_url`、`orders.receiver_email` 放在最後），這樣才能逐行比對。

```sql
-- ============================================================================
-- V1__init.sql（整合版）
-- 內容 = 原本 V1 ~ V10 全部跑完之後的最終結構 + 種子資料
-- ============================================================================


-- ============================== 商品相關 ==============================

-- 分類（主 / 副分類合併，用 parent_id 分層）
CREATE TABLE categories (
    id        BIGINT IDENTITY(1,1) NOT NULL,
    parent_id BIGINT        NULL,              -- NULL = 主分類；有值 = 副分類，指向所屬主分類（自我參照）
    name      NVARCHAR(50)  NOT NULL,          -- 顯示名稱：女裝 / 男裝 / 童裝 / 外套類…
    code      NVARCHAR(100) NULL,              -- [原 V2] Uniqlo 分類代碼：all_men / all_men-tops-t-shirts，前端與網址用
    icon_url  NVARCHAR(500) NULL,              -- [原 V4] 分類小圖示，例如 img/categories/icon-all_men-outer.jpg；只有第 2 層有
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
);
CREATE INDEX idx_categories_parent ON categories (parent_id);
-- [原 V2] code 有值的才要求不重複（允許多筆 NULL）
CREATE UNIQUE INDEX uk_categories_code ON categories (code) WHERE code IS NOT NULL;

-- 商品
CREATE TABLE products (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    slug        NVARCHAR(100)  NOT NULL,       -- 網址用字串 id（kids-1sam-0）
    category_id BIGINT         NOT NULL,
    name        NVARCHAR(200)  NOT NULL,       -- 關鍵字搜尋 LIKE
    description NVARCHAR(MAX)  NULL,
    price       INT            NOT NULL,       -- 售價
    orig_price  INT            NULL,           -- 原價；有值且 > price 就顯示特價
    is_new      BIT            NOT NULL CONSTRAINT df_products_is_new DEFAULT 0,   -- 新品標籤
    is_hot      BIT            NOT NULL CONSTRAINT df_products_is_hot DEFAULT 0,   -- 首頁熱門
    status      NVARCHAR(20)   NOT NULL CONSTRAINT df_products_status DEFAULT N'ON_SALE',  -- [原 V10] ProductStatus：ON_SALE / OFF_SHELF
    image_url   NVARCHAR(500)  NULL,           -- [原 V3] 商品主圖（列表、追蹤清單、購物車用）；各顏色的圖在 product_variants.url
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT uk_products_slug UNIQUE (slug),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_name     ON products (name);
CREATE INDEX idx_products_hot      ON products (is_hot);
CREATE INDEX idx_products_new      ON products (is_new);

-- SKU（顏色 × 尺寸）
CREATE TABLE product_variants (
    id           BIGINT IDENTITY(1,1) NOT NULL,
    product_id   BIGINT        NOT NULL,
    color        NVARCHAR(30)  NOT NULL,       -- 白 / 黑 / 藏青…
    size         NVARCHAR(20)  NOT NULL,       -- S / M / L / 110cm…
    sku_code     NVARCHAR(50)  NOT NULL,       -- 貨號
    stock        INT           NOT NULL,       -- 這個組合的庫存
    published_at DATETIME2(0)  NOT NULL CONSTRAINT df_variants_published_at DEFAULT SYSDATETIME(),
    url          NVARCHAR(500) NOT NULL,       -- 這個顏色的圖片相對路徑
    CONSTRAINT pk_product_variants PRIMARY KEY (id),
    CONSTRAINT uk_variants_product_color_size UNIQUE (product_id, color, size),
    CONSTRAINT uk_variants_sku UNIQUE (sku_code),
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);


-- ============================== 會員相關 ==============================

-- 會員
CREATE TABLE members (
    id            BIGINT IDENTITY(1,1) NOT NULL,
    email         NVARCHAR(255) NOT NULL,      -- 登入帳號，存小寫
    password_hash NVARCHAR(255) NOT NULL,      -- BCrypt 雜湊，絕對不存明碼
    name          NVARCHAR(50)  NOT NULL,
    phone         NVARCHAR(20)  NOT NULL,
    gender        NVARCHAR(10)  NOT NULL,      -- male / female（目前仍是小寫字串，沒有改 enum）
    birthday      DATE          NOT NULL,
    address       NVARCHAR(255) NULL,
    status        NVARCHAR(20)  NOT NULL CONSTRAINT df_members_status DEFAULT N'ACTIVE',  -- [原 V10] MemberStatus：ACTIVE / DISABLED
    created_at    DATETIME2(0)  NOT NULL CONSTRAINT df_members_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_members PRIMARY KEY (id),
    CONSTRAINT uk_members_email UNIQUE (email)
);

-- 購物車
CREATE TABLE cart_items (
    id         BIGINT IDENTITY(1,1) NOT NULL,
    member_id  BIGINT       NOT NULL,
    variant_id BIGINT       NOT NULL,
    qty        INT          NOT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_cart_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_cart_items PRIMARY KEY (id),
    CONSTRAINT uk_cart_member_variant UNIQUE (member_id, variant_id),
    CONSTRAINT fk_cart_member  FOREIGN KEY (member_id)  REFERENCES members (id)          ON DELETE CASCADE,
    CONSTRAINT fk_cart_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE CASCADE
);

-- 追蹤清單（追蹤的是「商品」不是 SKU）
CREATE TABLE wishlist_items (
    id         BIGINT IDENTITY(1,1) NOT NULL,
    member_id  BIGINT       NOT NULL,
    product_id BIGINT       NOT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_wish_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_wishlist_items PRIMARY KEY (id),
    CONSTRAINT uk_wish_member_product UNIQUE (member_id, product_id),
    CONSTRAINT fk_wish_member  FOREIGN KEY (member_id)  REFERENCES members (id)  ON DELETE CASCADE,
    CONSTRAINT fk_wish_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);


-- ============================== 折價券 ==============================

-- 折價券範本
CREATE TABLE coupons (
    id             BIGINT IDENTITY(1,1) NOT NULL,
    code           NVARCHAR(30)  NOT NULL,     -- WELCOME100，存大寫
    title          NVARCHAR(100) NOT NULL,     -- 新會員購物金
    type           NVARCHAR(20)  NOT NULL,     -- [原 V10] CouponType：AMOUNT / PERCENT（沒有免運券）
    value          INT           NOT NULL,     -- AMOUNT → 折多少元；PERCENT → 折幾 %（10 = 9 折）
    min_subtotal   INT           NOT NULL,     -- 消費門檻
    valid_days     INT           NOT NULL,     -- 有效期間
    is_signup_gift BIT           NOT NULL CONSTRAINT df_coupons_is_signup_gift DEFAULT 0, -- 註冊自動發放
    is_active      BIT           NOT NULL CONSTRAINT df_coupons_is_active DEFAULT 1,      -- 可否領取
    created_at     DATETIME2(0)  NOT NULL CONSTRAINT df_coupons_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_coupons PRIMARY KEY (id),
    CONSTRAINT uk_coupons_code UNIQUE (code)
);

-- 會員持有的折價券（order_id 的 FK 在 orders 建好後才補，見下方）
-- [原 V6] 同一張券可重複領取：每領一次存一筆，所以「沒有」UNIQUE(member_id, coupon_id)
CREATE TABLE member_coupons (
    id          BIGINT       IDENTITY(1,1) NOT NULL,
    member_id   BIGINT       NOT NULL,
    coupon_id   BIGINT       NOT NULL,
    expire_at   DATETIME2(0) NOT NULL,         -- 領取時算好：now + valid_days
    used_at     DATETIME2(0) NULL,             -- NULL = 未使用
    order_id    BIGINT       NULL,             -- 用在哪張訂單
    received_at DATETIME2(0) NOT NULL CONSTRAINT df_mc_received_at DEFAULT SYSDATETIME(),  -- 領取時間
    CONSTRAINT pk_member_coupons PRIMARY KEY (id),
    CONSTRAINT fk_mc_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_mc_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id)
);
-- [原 V6] 查「我的折價券」用
CREATE INDEX idx_member_coupons_member ON member_coupons (member_id);


-- ============================== 訂單 ==============================

-- 訂單主檔
CREATE TABLE orders (
    id               BIGINT IDENTITY(1,1) NOT NULL,
    order_no         NVARCHAR(30)  NOT NULL,   -- UC20260901-8842
    member_id        BIGINT        NOT NULL,
    status           NVARCHAR(20)  NOT NULL CONSTRAINT df_orders_status DEFAULT N'PENDING',  -- [原 V9] OrderStatus：PENDING / SHIPPED / DELIVERED / PICKED_UP / CANCELLED
    receiver_name    NVARCHAR(50)  NOT NULL,   -- 收件人
    receiver_phone   NVARCHAR(20)  NOT NULL,
    shipping_method  NVARCHAR(20)  NOT NULL,   -- [原 V10] ShippingMethod：HOME / CVS
    shipping_address NVARCHAR(255) NOT NULL,   -- 宅配地址或超商門市名
    payment_method   NVARCHAR(20)  NOT NULL,   -- [原 V10] PaymentMethod：CREDIT / ATM / COD
    note             NVARCHAR(255) NULL,       -- 備註
    subtotal         INT           NOT NULL,   -- 商品小計
    discount         INT           NOT NULL CONSTRAINT df_orders_discount DEFAULT 0,      -- 折價券折抵
    shipping_fee     INT           NOT NULL CONSTRAINT df_orders_shipping_fee DEFAULT 50, -- 運費（滿 1490 免運、否則 50）
    total            INT           NOT NULL,   -- 實付 = subtotal - discount + shipping_fee
    member_coupon_id BIGINT        NULL,       -- 用了哪張券
    paid_at          DATETIME2(0)  NULL,
    shipped_at       DATETIME2(0)  NULL,
    completed_at     DATETIME2(0)  NULL,
    created_at       DATETIME2(0)  NOT NULL CONSTRAINT df_orders_created_at DEFAULT SYSDATETIME(),
    receiver_email   NVARCHAR(255) NULL,       -- [原 V8] 收件人 Email（寄訂單通知用）；新訂單由 CheckoutRequest 的 @NotBlank 擋空值
    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT uk_orders_no UNIQUE (order_no),
    CONSTRAINT fk_orders_member FOREIGN KEY (member_id) REFERENCES members (id),
    CONSTRAINT fk_orders_member_coupon FOREIGN KEY (member_coupon_id) REFERENCES member_coupons (id)
);
CREATE INDEX idx_orders_member_time ON orders (member_id, created_at DESC);

-- 訂單明細（快照）
CREATE TABLE order_items (
    id           BIGINT IDENTITY(1,1) NOT NULL,
    order_id     BIGINT        NOT NULL,
    variant_id   BIGINT        NULL,           -- 反查用；商品刪除時設 NULL，明細照樣保留
    product_name NVARCHAR(200) NOT NULL,       -- 快照
    color        NVARCHAR(30)  NOT NULL,       -- 快照
    size         NVARCHAR(20)  NOT NULL,       -- 快照
    image_url    NVARCHAR(500) NULL,           -- 快照
    unit_price   INT           NOT NULL,       -- 下單當時單價
    qty          INT           NOT NULL,
    total_price  INT           NOT NULL,       -- unit_price x qty，存起來方便報表
    CONSTRAINT pk_order_items PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id)           ON DELETE CASCADE,
    CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE SET NULL
);
CREATE INDEX idx_order_items_order ON order_items (order_id);

-- 補上 member_coupons -> orders 的 FK（orders 建好了才能參照）
ALTER TABLE member_coupons
    ADD CONSTRAINT fk_mc_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL;


-- ============================== 客服 ==============================

-- 客服單
CREATE TABLE support_tickets (
    id         BIGINT IDENTITY(1,1) NOT NULL,
    ticket_no  NVARCHAR(30)  NOT NULL,         -- CS12345678
    member_id  BIGINT        NULL,             -- 未登入也能送，所以可 NULL
    email      NVARCHAR(255) NOT NULL,
    topic      NVARCHAR(50)  NOT NULL,         -- 訂單與物流 / 退換貨 / 商品諮詢 / 付款與發票 / 折價券與活動 / 會員帳號問題 / 其他
    message    NVARCHAR(MAX) NOT NULL,
    status     NVARCHAR(20)  NOT NULL CONSTRAINT df_tickets_status DEFAULT N'IN_PROGRESS',  -- IN_PROGRESS / PENDING / RESOLVED
    created_at DATETIME2(0)  NOT NULL CONSTRAINT df_tickets_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_support_tickets PRIMARY KEY (id),
    CONSTRAINT uk_tickets_no UNIQUE (ticket_no),
    CONSTRAINT fk_tickets_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE SET NULL
);


-- ============================== 種子資料 ==============================

-- [原 V5] 測試會員：test@unicloth.com / Test1234（password_hash 是 BCrypt 雜湊）
INSERT INTO members (email, password_hash, name, phone, gender, birthday)
VALUES (N'test@unicloth.com',
        N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO',
        N'測試會員',
        N'0912345678',
        N'male',
        '2000-01-01');

-- [原 V7] 測試折價券（[原 V10] type 已改大寫）
-- AMOUNT：滿 990 折 100 元，領取後 30 天內有效
INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, is_signup_gift, is_active)
VALUES (N'WELCOME100', N'新會員 100 元折價券', N'AMOUNT', 100, 990, 30, 0, 1);

-- PERCENT：滿 1490 打 9 折（value = 10 代表折 10%），領取後 14 天內有效
INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, is_signup_gift, is_active)
VALUES (N'SAVE10', N'全館 9 折券', N'PERCENT', 10, 1490, 14, 0, 1);
```

## 4. 為什麼「不能直接換掉檔案」（重要）

Flyway 會在每個資料庫裡記一張 `flyway_schema_history`，裡面寫著「V1 ~ V10 都跑過了，以及每支檔案的 checksum」。

如果直接把 V1 ~ V10 刪掉、換成這支新 V1，組員一拉 code 啟動就會：

1. 發現 V1 的 checksum 跟紀錄不一樣 → **啟動失敗**（`Validate failed: Migration checksum mismatch`）。
2. 發現紀錄裡有 V2 ~ V10，但專案裡找不到檔案 → 也會被判定驗證失敗。

所以這件事**一定要全組約好同一個時間點一起做**，不能偷偷換。

## 5. 正式套用時的步驟（建議）

### 負責整合的人

1. 先確認所有人手上正在做、還沒合併的分支**沒有新增 V11 以後的 migration**（有的話先合進來，再一起整合）。
2. 刪掉 `V2__...` ~ `V10__...`，用第 3 節的內容覆蓋 `V1__init.sql`。
3. 自己先 `docker compose down -v` → `docker compose up -d` → IDEA Run，確認能正常啟動。
4. 單獨一個 commit，訊息寫清楚，例如：`Flyway 整合 V1~V10 為單一 V1（需重建資料庫）`。
5. 在群組通知：**拉下這個 commit 後一定要重建資料庫**。

### 每個組員

```bash
git pull
docker compose down -v     # 會清空本機資料庫（購物車、訂單、自己註冊的帳號都會不見）
docker compose up -d
# 然後 IDEA 按 Run，Flyway 會從新的 V1 重建
```

> 商品資料：要依照平常匯入商品的方式（爬蟲產出的資料）再匯入一次。
> 測試會員 `test@unicloth.com / Test1234` 和兩張測試折價券會由 V1 自動建立。

### 之後的規則不變

- 整合完之後要改資料庫，一樣**新開 V2、V3…**，不要再改 V1。
- 跑過的檔案不要修改（checksum 會不一致）。

## 6. 還沒決定、可以順便討論的事

這些是我的**建議**，目前整合版刻意**沒有**改，以保持跟現在資料庫 100% 相同：

- `orders.receiver_email`：當初因為舊訂單沒有 Email 才允許 NULL；重建後沒有舊資料，可以考慮改成 `NOT NULL`。
- `members.gender`：目前仍是小寫 `male` / `female` 字串，其他欄位都已改成大寫 enum，要不要一起統一？
- 欄位順序：`products.image_url`、`orders.receiver_email` 可以挪到比較合理的位置（只影響可讀性，不影響程式）。

若要改，等全組同意後在正式套用時一起改，並重新驗證一次。
