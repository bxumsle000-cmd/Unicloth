-- ============================== 商品相關 ==============================

-- 分類（主 / 副分類合併，用 parent_id 分層）
CREATE TABLE categories (
    id        BIGINT IDENTITY(1,1) NOT NULL,
    parent_id BIGINT       NULL,               -- NULL = 主分類；有值 = 副分類，指向所屬主分類（自我參照）
    name      NVARCHAR(50) NOT NULL,           -- 顯示名稱：主分類 女裝 / 男裝 / 童裝；副分類 外套類
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
);
CREATE INDEX idx_categories_parent ON categories (parent_id);

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
    status      NVARCHAR(20)   NOT NULL CONSTRAINT df_products_status DEFAULT N'on_sale',  -- on_sale / off_shelf
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT uk_products_slug UNIQUE (slug),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_name     ON products (name);
CREATE INDEX idx_products_hot      ON products (is_hot);
CREATE INDEX idx_products_new     ON products (is_new);

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
    status        NVARCHAR(20)  NOT NULL CONSTRAINT df_members_status DEFAULT N'active',  -- active / disabled
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
    type           NVARCHAR(20)  NOT NULL,     -- amount / percent / shipping
    value          INT           NOT NULL,     -- amount → 折多少元；percent → 折幾 %（10 = 9 折）；shipping → 0
    min_subtotal   INT           NOT NULL,     -- 消費門檻
    valid_days     INT           NOT NULL,     -- 有效期間
    is_signup_gift BIT           NOT NULL CONSTRAINT df_coupons_is_signup_gift DEFAULT 0, -- 註冊自動發放
    is_active      BIT           NOT NULL CONSTRAINT df_coupons_is_active DEFAULT 1,      -- 可否領取
    created_at     DATETIME2(0)  NOT NULL CONSTRAINT df_coupons_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_coupons PRIMARY KEY (id),
    CONSTRAINT uk_coupons_code UNIQUE (code)
);

-- 會員持有的折價券（order_id 的 FK 在 orders 建好後才補，見下方）
CREATE TABLE member_coupons (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    member_id   BIGINT       NOT NULL,
    coupon_id   BIGINT       NOT NULL,
    expire_at   DATETIME2(0) NOT NULL,         -- 領取時算好：now + valid_days
    used_at     DATETIME2(0) NULL,             -- NULL = 未使用
    order_id    BIGINT       NULL,             -- 用在哪張訂單
    received_at DATETIME2(0) NOT NULL CONSTRAINT df_mc_received_at DEFAULT SYSDATETIME(),  -- 領取時間
    CONSTRAINT pk_member_coupons PRIMARY KEY (id),
    CONSTRAINT uk_member_coupons UNIQUE (member_id, coupon_id),
    CONSTRAINT fk_mc_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_mc_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id)
);


-- ============================== 訂單 ==============================

-- 訂單主檔
CREATE TABLE orders (
    id               BIGINT IDENTITY(1,1) NOT NULL,
    order_no         NVARCHAR(30)  NOT NULL,   -- UC20260901-8842
    member_id        BIGINT        NOT NULL,
    status           NVARCHAR(20)  NOT NULL CONSTRAINT df_orders_status DEFAULT N'pending',  -- 訂單確認中 / 出貨 / shipped / 送達門市 / 已取貨 / cancelled
    receiver_name    NVARCHAR(50)  NOT NULL,   -- 收件人
    receiver_phone   NVARCHAR(20)  NOT NULL,
    shipping_method  NVARCHAR(20)  NOT NULL,   -- home / cvs
    shipping_address NVARCHAR(255) NOT NULL,   -- 宅配地址或超商門市名
    payment_method   NVARCHAR(20)  NOT NULL,   -- credit / atm / cod
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
    total_price   INT           NOT NULL,       -- unit_price x qty，存起來方便報表
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