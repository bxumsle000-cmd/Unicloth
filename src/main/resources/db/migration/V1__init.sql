-- ============================================================================
-- 整合版：原本 V1 ~ V12 合併成這一支，只給「全新資料庫」使用（docker compose down -v 之後）。
-- 結構與種子資料跟依序跑完舊的 V1 ~ V12 結果相同。
-- ============================================================================


-- ============================== 商品相關 ==============================

-- 分類（主 / 副分類合併，用 parent_id 分層）
CREATE TABLE categories (
    id        BIGINT IDENTITY(1,1) NOT NULL,
    parent_id BIGINT        NULL,              -- NULL = 主分類；有值 = 副分類，指向所屬主分類（自我參照）
    name      NVARCHAR(50)  NOT NULL,          -- 顯示名稱：主分類 女裝 / 男裝 / 童裝；副分類 外套類
    code      NVARCHAR(100) NULL,              -- 固定代碼，直接用 Uniqlo 的分類代碼：all_men / all_men-tops-t-shirts（資料庫 id 每台電腦可能不同，code 不會變）
    icon_url  NVARCHAR(500) NULL,              -- 分類小圖示，例如 img/categories/icon-all_men-outer.jpg；目前只有第 2 層有
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
);
CREATE INDEX idx_categories_parent ON categories (parent_id);
-- code 有值的才要求不重複
CREATE UNIQUE INDEX uk_categories_code ON categories (code) WHERE code IS NOT NULL;

-- 商品
CREATE TABLE products (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    slug        NVARCHAR(100)  NOT NULL,       -- 沿用 demo 的字串 id（kids-1sam-0），網址用
    category_id BIGINT         NOT NULL,
    name        NVARCHAR(200)  NOT NULL,       -- 關鍵字搜尋 LIKE
    description NVARCHAR(MAX)  NULL,
    price       INT            NOT NULL,       -- 售價
    orig_price  INT            NULL,           -- 原價；有值且 > price 就顯示特價
    is_new      BIT            NOT NULL CONSTRAINT df_products_is_new DEFAULT 0,   -- 新品標籤
    is_hot      BIT            NOT NULL CONSTRAINT df_products_is_hot DEFAULT 0,   -- 首頁熱門
    status      NVARCHAR(20)   NOT NULL CONSTRAINT df_products_status DEFAULT N'ON_SALE',  -- ON_SALE / OFF_SHELF
    image_url   NVARCHAR(500)  NULL,           -- 商品主圖（縮圖），列表、追蹤清單、購物車直接用；各顏色的圖在 product_variants.url
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
    url          NVARCHAR(500) NOT NULL,       -- 現階段存 img/colth/... 相對路徑
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
    gender        NVARCHAR(10)  NOT NULL,      -- male / female
    birthday      DATE          NOT NULL,
    address       NVARCHAR(255) NULL,
    status        NVARCHAR(20)  NOT NULL CONSTRAINT df_members_status DEFAULT N'ACTIVE',  -- ACTIVE / DISABLED
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
    type           NVARCHAR(20)  NOT NULL,     -- AMOUNT / PERCENT
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
-- 同一張券允許重複領取：每領一次就存一筆，各自有 expire_at / used_at / order_id，所以沒有 UNIQUE(member_id, coupon_id)
CREATE TABLE member_coupons (
    id          BIGINT IDENTITY(1,1) NOT NULL,
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
-- 查「我的折價券」用
CREATE INDEX idx_member_coupons_member ON member_coupons (member_id);


-- ============================== 訂單 ==============================

-- 訂單主檔
CREATE TABLE orders (
    id               BIGINT IDENTITY(1,1) NOT NULL,
    order_no         NVARCHAR(30)  NOT NULL,   -- UC20260901-8842
    member_id        BIGINT        NOT NULL,
    status           NVARCHAR(20)  NOT NULL CONSTRAINT df_orders_status DEFAULT N'PENDING',  -- PENDING / SHIPPED / DELIVERED / PICKED_UP / CANCELLED
    receiver_name    NVARCHAR(50)  NOT NULL,   -- 收件人
    receiver_phone   NVARCHAR(20)  NOT NULL,
    receiver_email   NVARCHAR(255) NULL,       -- 寄訂單通知用；新訂單由 CheckoutRequest 的 @NotBlank 擋下空值
    shipping_method  NVARCHAR(20)  NOT NULL,   -- HOME / CVS
    shipping_address NVARCHAR(255) NOT NULL,   -- 宅配地址或超商門市名
    payment_method   NVARCHAR(20)  NOT NULL,   -- CREDIT / ATM / COD
    note             NVARCHAR(255) NULL,       -- 備註（結帳頁的 f-note）
    subtotal         INT           NOT NULL,   -- 商品小計
    discount         INT           NOT NULL CONSTRAINT df_orders_discount DEFAULT 0,      -- 折價券折抵
    shipping_fee     INT           NOT NULL CONSTRAINT df_orders_shipping_fee DEFAULT 50, -- 運費（滿 1490 免運、否則 50）
    total            INT           NOT NULL,   -- 實付 = subtotal - discount + shipping_fee
    member_coupon_id BIGINT        NULL,       -- 用了哪張券
    paid_at          DATETIME2(0)  NULL,
    shipped_at       DATETIME2(0)  NULL,
    completed_at     DATETIME2(0)  NULL,
    created_at       DATETIME2(0)  NOT NULL CONSTRAINT df_orders_created_at DEFAULT SYSDATETIME(),
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
    ticket_no  NVARCHAR(30)   NOT NULL,        -- CS12345678
    member_id  BIGINT         NULL,            -- 未登入也能送，所以可 NULL
    email      NVARCHAR(255)  NOT NULL,
    topic      NVARCHAR(50)   NOT NULL,        -- 訂單與物流 / 退換貨 / 商品諮詢 / 付款與發票 / 折價券與活動 / 會員帳號問題 / 其他
    message    NVARCHAR(2000) NOT NULL,        -- 最多 2000 字，跟 CreateSupportTicketRequest 的 @Size(max = 2000) 一致
    status     NVARCHAR(20)   NOT NULL CONSTRAINT df_tickets_status DEFAULT N'IN_PROGRESS',  -- IN_PROGRESS / RESOLVED
    created_at DATETIME2(0)   NOT NULL CONSTRAINT df_tickets_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_support_tickets PRIMARY KEY (id),
    CONSTRAINT uk_tickets_no UNIQUE (ticket_no),
    CONSTRAINT fk_tickets_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE SET NULL
);


-- ============================== 種子資料 ==============================
-- 注意：這支檔案跑過之後就不要再修改（Flyway 會比對 checksum，不一致就啟動失敗），要改資料請另開 V2。

-- 測試會員（全新資料庫的第一筆會員，id = 1）
-- 登入帳號：test@unicloth.com
-- 登入密碼：Test1234
-- password_hash 是 BCryptPasswordEncoder 對 "Test1234" 算出來的雜湊（不存明碼）
INSERT INTO members (email, password_hash, name, phone, gender, birthday)
VALUES (N'test@unicloth.com',
        N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO',
        N'測試會員',
        N'0912345678',
        N'male',
        '2000-01-01');

-- 測試用折價券
-- AMOUNT：滿 990 折 100 元，領取後 30 天內有效
INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, is_signup_gift, is_active)
VALUES (N'WELCOME100', N'新會員 100 元折價券', N'AMOUNT', 100, 990, 30, 0, 1);

-- PERCENT：滿 1490 打 9 折（value = 10 代表折 10%），領取後 14 天內有效
INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, is_signup_gift, is_active)
VALUES (N'SAVE10', N'全館 9 折券', N'PERCENT', 10, 1490, 14, 0, 1);

-- 把上面兩張券發給測試會員；expire_at 的算法跟 CouponService 領券時一樣：領取當下 + valid_days
INSERT INTO member_coupons (member_id, coupon_id, expire_at)
SELECT m.id,
       c.id,
       DATEADD(DAY, c.valid_days, SYSDATETIME())
FROM members m
JOIN coupons c ON c.code IN (N'WELCOME100', N'SAVE10')
WHERE m.email = N'test@unicloth.com';
