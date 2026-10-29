-- ============================================================================
-- 整合版：原本 V1 ~ V15 合併成這一支，只給「全新資料庫」使用（docker compose down -v 之後）。
-- 結構與種子資料跟依序跑完舊的 V1 ~ V15 結果相同。
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
    id               BIGINT IDENTITY(1,1) NOT NULL,
    slug             NVARCHAR(100)  NOT NULL,  -- 沿用 demo 的字串 id（kids-1sam-0），網址用
    category_id      BIGINT         NOT NULL,
    name             NVARCHAR(200)  NOT NULL,  -- 關鍵字搜尋 LIKE
    description      NVARCHAR(MAX)  NULL,
    price            INT            NOT NULL,  -- 售價
    orig_price       INT            NULL,      -- 原價；有值且 > price 就顯示特價
    is_new           BIT            NOT NULL CONSTRAINT df_products_is_new DEFAULT 0,   -- 新品標籤
    is_hot           BIT            NOT NULL CONSTRAINT df_products_is_hot DEFAULT 0,   -- 首頁熱門
    status           NVARCHAR(20)   NOT NULL CONSTRAINT df_products_status DEFAULT N'ON_SALE',  -- ON_SALE / OFF_SHELF
    image_url        NVARCHAR(500)  NULL,      -- 商品主圖（縮圖），列表、追蹤清單、購物車直接用；各顏色的圖在 product_variants.url
    scheduled_off_at DATETIME2      NULL,      -- 自動下架時間；NULL = 不自動下架，有值 = 時間到了由後端排程下架
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT uk_products_slug UNIQUE (slug),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_name     ON products (name);
CREATE INDEX idx_products_hot      ON products (is_hot);
CREATE INDEX idx_products_new      ON products (is_new);
-- 自動下架排程依商品狀態與下架時間查詢
CREATE INDEX idx_products_scheduled_off ON products (status, scheduled_off_at) WHERE scheduled_off_at IS NOT NULL;

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


-- ============================== 商品風格 ==============================

-- 風格使用固定代碼，名稱可調整而不影響商品關聯
CREATE TABLE styles (
    id   BIGINT IDENTITY(1,1) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(50) NOT NULL,
    CONSTRAINT pk_styles PRIMARY KEY (id),
    CONSTRAINT uk_styles_code UNIQUE (code),
    CONSTRAINT uk_styles_name UNIQUE (name)
);

-- 一件商品可有多個風格，同一風格不可重複標記（商品標記由 DataSeeder 匯入商品後執行 data/product_styles.sql）
CREATE TABLE product_styles (
    product_id BIGINT NOT NULL,
    style_id   BIGINT NOT NULL,
    CONSTRAINT pk_product_styles PRIMARY KEY (product_id, style_id),
    CONSTRAINT fk_product_styles_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_styles_style FOREIGN KEY (style_id) REFERENCES styles (id)
);
CREATE INDEX idx_product_styles_style ON product_styles (style_id, product_id);

-- 別名僅存同義詞；一個搜尋詞可對應多種風格
CREATE TABLE style_aliases (
    style_id BIGINT       NOT NULL,
    alias    NVARCHAR(50) NOT NULL,
    CONSTRAINT pk_style_aliases PRIMARY KEY (style_id, alias),
    CONSTRAINT fk_style_aliases_style FOREIGN KEY (style_id) REFERENCES styles (id) ON DELETE CASCADE,
    CONSTRAINT ck_style_aliases_not_blank CHECK (LEN(LTRIM(RTRIM(alias))) > 0)
);
CREATE INDEX idx_style_aliases_alias ON style_aliases (alias, style_id);

-- 單向關聯：搜尋來源風格時，可補充目標風格；雙向需各存一筆
CREATE TABLE style_relations (
    source_style_id BIGINT NOT NULL,
    target_style_id BIGINT NOT NULL,
    weight          INT    NOT NULL,
    CONSTRAINT pk_style_relations PRIMARY KEY (source_style_id, target_style_id),
    CONSTRAINT fk_style_relations_source FOREIGN KEY (source_style_id) REFERENCES styles (id),
    CONSTRAINT fk_style_relations_target FOREIGN KEY (target_style_id) REFERENCES styles (id),
    CONSTRAINT ck_style_relations_distinct CHECK (source_style_id <> target_style_id),
    CONSTRAINT ck_style_relations_weight CHECK (weight BETWEEN 1 AND 100)
);
CREATE INDEX idx_style_relations_target ON style_relations (target_style_id);


-- ============================== 會員相關 ==============================

-- 會員帳號：只能用 Google（Firebase）登入，所以沒有密碼欄位
CREATE TABLE members (
    id           BIGINT IDENTITY(1,1) NOT NULL,
    email        NVARCHAR(255) NOT NULL,       -- 登入帳號，存小寫
    status       NVARCHAR(20)  NOT NULL CONSTRAINT df_members_status DEFAULT N'ACTIVE',  -- ACTIVE / DISABLED
    created_at   DATETIME2(0)  NOT NULL CONSTRAINT df_members_created_at DEFAULT SYSDATETIME(),
    firebase_uid NVARCHAR(128) NULL,           -- Firebase 給每個 Google 帳號的唯一 id，用它找會員
    CONSTRAINT pk_members PRIMARY KEY (id),
    CONSTRAINT uk_members_email UNIQUE (email)
);
-- SQL Server 的 UNIQUE 只允許「一筆」NULL，所以用加了 WHERE 的唯一索引：只檢查有值的列不能重複
CREATE UNIQUE INDEX uk_members_firebase_uid ON members (firebase_uid) WHERE firebase_uid IS NOT NULL;

-- 會員個人資料（補填用），一個會員最多一筆（一對一），member_id 同時是 PK 和 FK
-- 第一次 Google 登入只會建 members，補填完才建 member_profiles，所以「有沒有 profile」就代表「資料補齊了沒」
CREATE TABLE member_profiles (
    member_id BIGINT        NOT NULL,
    name      NVARCHAR(50)  NOT NULL,
    phone     NVARCHAR(20)  NOT NULL,
    gender    NVARCHAR(10)  NOT NULL,          -- male / female
    birthday  DATE          NOT NULL,
    address   NVARCHAR(255) NULL,              -- 可 NULL；結帳時當宅配地址的預設值
    CONSTRAINT pk_member_profiles PRIMARY KEY (member_id),
    CONSTRAINT fk_profiles_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
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

-- 會員瀏覽各商品的累積次數
CREATE TABLE member_product_views (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    member_id       BIGINT       NOT NULL,
    product_id      BIGINT       NOT NULL,
    view_count      INT          NOT NULL CONSTRAINT df_member_product_views_count DEFAULT 1,
    first_viewed_at DATETIME2(0) NOT NULL CONSTRAINT df_member_product_views_first DEFAULT SYSDATETIME(),
    last_viewed_at  DATETIME2(0) NOT NULL CONSTRAINT df_member_product_views_last DEFAULT SYSDATETIME(),
    CONSTRAINT pk_member_product_views PRIMARY KEY (id),
    CONSTRAINT uk_member_product_views_member_product UNIQUE (member_id, product_id),
    CONSTRAINT fk_member_product_views_member  FOREIGN KEY (member_id)  REFERENCES members (id)  ON DELETE CASCADE,
    CONSTRAINT fk_member_product_views_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
-- 查詢會員最近瀏覽與偏好時使用
CREATE INDEX idx_member_product_views_recent     ON member_product_views (member_id, last_viewed_at DESC);
-- 計算商品瀏覽熱度時使用
CREATE INDEX idx_member_product_views_popularity ON member_product_views (product_id, view_count DESC);


-- ============================== 後台員工 ==============================

-- 員工帳號（登入後台用），跟前台會員 members 完全分開
-- 一個員工只屬於一個部門；部門 → 權限的對應寫在 Java 的 Department enum，不存資料庫
CREATE TABLE staff (
    id            BIGINT IDENTITY(1,1) NOT NULL,
    account       NVARCHAR(50)  NOT NULL,      -- 登入帳號，例如 sys01；建立後不能改
    password_hash NVARCHAR(255) NOT NULL,      -- BCrypt 雜湊，絕對不存明碼
    name          NVARCHAR(50)  NOT NULL,
    status        NVARCHAR(20)  NOT NULL CONSTRAINT df_staff_status DEFAULT N'ACTIVE',  -- ACTIVE / DISABLED
    last_login_at DATETIME2(0)  NULL,          -- 還沒登入過是 NULL
    created_at    DATETIME2(0)  NOT NULL CONSTRAINT df_staff_created_at DEFAULT SYSDATETIME(),
    department    NVARCHAR(20)  NOT NULL,      -- PRODUCT / ORDER / CS / MKT / ADMIN（ADMIN 可以進所有部門的後台）
    CONSTRAINT pk_staff PRIMARY KEY (id),
    CONSTRAINT uk_staff_account UNIQUE (account)
);


-- ============================== 庫存異動 ==============================

-- 一次進貨或盤點操作的主紀錄
CREATE TABLE inventory_transactions (
    id         BIGINT IDENTITY(1,1) NOT NULL,
    type       NVARCHAR(20)  NOT NULL,         -- RECEIVE / ADJUSTMENT
    note       NVARCHAR(255) NULL,
    staff_id   BIGINT        NOT NULL,
    created_at DATETIME2(0)  NOT NULL CONSTRAINT df_inventory_transactions_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_inventory_transactions PRIMARY KEY (id),
    CONSTRAINT ck_inventory_transactions_type CHECK (type IN (N'RECEIVE', N'ADJUSTMENT')),
    CONSTRAINT fk_inventory_transactions_staff FOREIGN KEY (staff_id) REFERENCES staff (id)
);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions (created_at DESC);
CREATE INDEX idx_inventory_transactions_staff      ON inventory_transactions (staff_id);

-- 該次操作中，每個 SKU 的庫存變化（商品資訊存快照）
CREATE TABLE inventory_transaction_items (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    transaction_id  BIGINT        NOT NULL,
    variant_id      BIGINT        NULL,        -- 反查用；SKU 刪除時設 NULL，紀錄照樣保留
    sku_code        NVARCHAR(50)  NOT NULL,    -- 快照
    product_name    NVARCHAR(200) NOT NULL,    -- 快照
    color           NVARCHAR(30)  NOT NULL,    -- 快照
    size            NVARCHAR(20)  NOT NULL,    -- 快照
    quantity_change INT           NOT NULL,
    stock_before    INT           NOT NULL,
    stock_after     INT           NOT NULL,
    CONSTRAINT pk_inventory_transaction_items PRIMARY KEY (id),
    CONSTRAINT fk_inventory_items_transaction FOREIGN KEY (transaction_id) REFERENCES inventory_transactions (id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_items_variant     FOREIGN KEY (variant_id)     REFERENCES product_variants (id)       ON DELETE SET NULL,
    CONSTRAINT ck_inventory_items_stock_before    CHECK (stock_before >= 0),
    CONSTRAINT ck_inventory_items_stock_after     CHECK (stock_after >= 0),
    CONSTRAINT ck_inventory_items_quantity_change CHECK (quantity_change <> 0)
);
CREATE INDEX idx_inventory_items_transaction ON inventory_transaction_items (transaction_id);
CREATE INDEX idx_inventory_items_variant     ON inventory_transaction_items (variant_id);


-- ============================== 折價券 ==============================

-- 折價券範本
CREATE TABLE coupons (
    id           BIGINT IDENTITY(1,1) NOT NULL,
    code         NVARCHAR(30)  NOT NULL,       -- WELCOME100，存大寫
    title        NVARCHAR(100) NOT NULL,       -- 新會員購物金
    type         NVARCHAR(20)  NOT NULL,       -- AMOUNT / PERCENT
    value        INT           NOT NULL,       -- AMOUNT → 折多少元；PERCENT → 折幾 %（10 = 9 折）
    min_subtotal INT           NOT NULL,       -- 消費門檻
    valid_days   INT           NOT NULL,       -- 有效期間
    is_active    BIT           NOT NULL CONSTRAINT df_coupons_is_active DEFAULT 1,      -- 可否領取
    created_at   DATETIME2(0)  NOT NULL CONSTRAINT df_coupons_created_at DEFAULT SYSDATETIME(),
    auto_trigger NVARCHAR(20)  NULL,           -- 自動發送時機：BIRTHDAY；NULL = 只能手動發
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
    source      NVARCHAR(20) NOT NULL CONSTRAINT df_mc_source DEFAULT N'MANUAL',            -- 這張券怎麼來的：MANUAL / BIRTHDAY
    CONSTRAINT pk_member_coupons PRIMARY KEY (id),
    CONSTRAINT fk_mc_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_mc_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id)
);
-- 查「我的折價券」用
CREATE INDEX idx_member_coupons_member      ON member_coupons (member_id);
-- 發券紀錄頁：依發券日期篩選、排序
CREATE INDEX idx_member_coupons_received_at ON member_coupons (received_at);

-- 預約發送（立即發送不存這裡，直接寫進 member_coupons）
CREATE TABLE coupon_schedules (
    id           BIGINT IDENTITY(1,1) NOT NULL,
    coupon_id    BIGINT       NOT NULL,
    target_all   BIT          NOT NULL,        -- 1 = 全部會員（發送當下的會員）；0 = 看 coupon_schedule_members
    scheduled_at DATETIME2(0) NOT NULL,        -- 預約時間
    status       NVARCHAR(20) NOT NULL CONSTRAINT df_cs_status DEFAULT N'PENDING',  -- PENDING / SENT / FAILED / CANCELLED
    sent_at      DATETIME2(0) NULL,            -- 實際發出的時間
    sent_count   INT          NULL,            -- 實際發了幾位
    created_by   BIGINT       NOT NULL,        -- 建立預約的員工
    created_at   DATETIME2(0) NOT NULL CONSTRAINT df_cs_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_coupon_schedules PRIMARY KEY (id),
    CONSTRAINT fk_cs_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id),
    CONSTRAINT fk_cs_staff FOREIGN KEY (created_by) REFERENCES staff (id)
);
-- 排程每次查「等待中、時間到了」的預約用
CREATE INDEX idx_coupon_schedules_status_time ON coupon_schedules (status, scheduled_at);

-- 指定會員的預約要發給誰；target_all = 1 的預約這裡沒有資料
CREATE TABLE coupon_schedule_members (
    schedule_id BIGINT NOT NULL,
    member_id   BIGINT NOT NULL,
    CONSTRAINT pk_coupon_schedule_members PRIMARY KEY (schedule_id, member_id),
    CONSTRAINT fk_csm_schedule FOREIGN KEY (schedule_id) REFERENCES coupon_schedules (id) ON DELETE CASCADE,
    CONSTRAINT fk_csm_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);


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
    shipping_carrier NVARCHAR(50)  NULL,       -- 物流業者
    tracking_number  NVARCHAR(100) NULL,       -- 物流單號
    delivered_at     DATETIME2     NULL,       -- 送達時間
    CONSTRAINT pk_orders PRIMARY KEY (id),
    CONSTRAINT uk_orders_no UNIQUE (order_no),
    CONSTRAINT fk_orders_member FOREIGN KEY (member_id) REFERENCES members (id),
    CONSTRAINT fk_orders_member_coupon FOREIGN KEY (member_coupon_id) REFERENCES member_coupons (id)
);
CREATE INDEX idx_orders_member_time       ON orders (member_id, created_at DESC);
CREATE INDEX idx_orders_status_created_at ON orders (status, created_at DESC);

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

-- 綠界金流付款紀錄：每一筆代表一次付款嘗試
CREATE TABLE payments (
    id                BIGINT IDENTITY(1,1) NOT NULL,
    order_id          BIGINT       NOT NULL,   -- 對應 Unicloth 訂單
    merchant_trade_no NVARCHAR(20) NOT NULL,   -- 傳給綠界的交易編號，必須唯一
    ecpay_trade_no    NVARCHAR(30) NULL,       -- 綠界付款完成後回傳的交易編號
    amount            INT          NOT NULL,   -- 付款金額，以新台幣元為單位
    payment_method    NVARCHAR(20) NOT NULL,   -- CREDIT / ATM
    status            NVARCHAR(20) NOT NULL CONSTRAINT df_payments_status DEFAULT N'PENDING',  -- PENDING / PAID / FAILED / CANCELLED
    created_at        DATETIME2(0) NOT NULL CONSTRAINT df_payments_created_at DEFAULT SYSDATETIME(),
    paid_at           DATETIME2(0) NULL,       -- 付款完成時間
    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT uk_payments_merchant_trade_no UNIQUE (merchant_trade_no),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT ck_payments_amount CHECK (amount >= 0)
);
CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_status   ON payments (status);


-- ============================== 客服 ==============================

-- 客服單
CREATE TABLE support_tickets (
    id          BIGINT IDENTITY(1,1) NOT NULL,
    ticket_no   NVARCHAR(30)   NOT NULL,       -- CS12345678
    member_id   BIGINT         NULL,           -- 未登入也能送，所以可 NULL
    email       NVARCHAR(255)  NOT NULL,
    topic       NVARCHAR(50)   NOT NULL,       -- 訂單與物流 / 退換貨 / 商品諮詢 / 付款與發票 / 折價券與活動 / 會員帳號問題 / 其他
    message     NVARCHAR(2000) NOT NULL,       -- 最多 2000 字，跟 CreateSupportTicketRequest 的 @Size(max = 2000) 一致
    status      NVARCHAR(20)   NOT NULL CONSTRAINT df_tickets_status DEFAULT N'IN_PROGRESS',  -- IN_PROGRESS / RESOLVED
    created_at  DATETIME2(0)   NOT NULL CONSTRAINT df_tickets_created_at DEFAULT SYSDATETIME(),
    reply       NVARCHAR(2000) NULL,           -- 客服回覆內容
    replied_at  DATETIME2      NULL,
    resolved_at DATETIME2      NULL,
    CONSTRAINT pk_support_tickets PRIMARY KEY (id),
    CONSTRAINT uk_tickets_no UNIQUE (ticket_no),
    CONSTRAINT fk_tickets_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE SET NULL
);
CREATE INDEX idx_support_tickets_status_created_at ON support_tickets (status, created_at DESC);


-- ============================== 種子資料 ==============================
-- 注意：這支檔案跑過之後就不要再修改（Flyway 會比對 checksum，不一致就啟動失敗），要改資料請另開 V2。

-- 測試用折價券（DemoDataSeeder 產生假資料時會拿這兩張發給假會員）
-- AMOUNT：滿 990 折 100 元，領取後 30 天內有效
INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, is_active)
VALUES (N'WELCOME100', N'新會員 100 元折價券', N'AMOUNT', 100, 990, 30, 1);

-- PERCENT：滿 1490 打 9 折（value = 10 代表折 10%），領取後 14 天內有效
INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, is_active)
VALUES (N'SAVE10', N'全館 9 折券', N'PERCENT', 10, 1490, 14, 1);

-- 後台員工：每個部門各一個測試帳號，密碼都是 "Test1234"
-- password_hash 是 BCryptPasswordEncoder 對 "Test1234" 算出來的雜湊（不存明碼）
-- sys01 是第一個管理者：沒有他就沒人能進後台新增其他員工
INSERT INTO staff (account, password_hash, name, department)
VALUES
    (N'sys01',     N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'系統管理員',     N'ADMIN'),
    (N'product01', N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'商品部測試員',   N'PRODUCT'),
    (N'order01',   N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'訂單物流測試員', N'ORDER'),
    (N'cs01',      N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'客服測試員',     N'CS'),
    (N'mkt01',     N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'行銷測試員',     N'MKT');

-- 初始風格
INSERT INTO styles (code, name) VALUES
    (N'japanese',   N'日系'),
    (N'natural',    N'自然風'),
    (N'minimal',    N'簡約'),
    (N'casual',     N'休閒'),
    (N'sporty',     N'運動風'),
    (N'urban_work', N'都會通勤'),
    (N'sweet',      N'甜美'),
    (N'preppy',     N'學院風');

-- 搜尋別名：不同說法對應到同一個正式風格
INSERT INTO style_aliases (style_id, alias)
SELECT style.id, alias_data.alias
FROM (
    VALUES
        (N'japanese',   N'日式'),
        (N'japanese',   N'日本風'),
        (N'japanese',   N'日本系'),
        (N'natural',    N'自然系'),
        (N'natural',    N'森系'),
        (N'minimal',    N'極簡'),
        (N'minimal',    N'簡約風'),
        (N'casual',     N'日常'),
        (N'casual',     N'休閒風'),
        (N'sporty',     N'運動'),
        (N'sporty',     N'運動休閒'),
        (N'urban_work', N'通勤'),
        (N'urban_work', N'上班穿搭'),
        (N'urban_work', N'都會風'),
        (N'sweet',      N'可愛'),
        (N'sweet',      N'少女風'),
        (N'sweet',      N'甜美風'),
        (N'preppy',     N'學院'),
        (N'preppy',     N'學院系'),
        (N'preppy',     N'英倫學院')
) AS alias_data (style_code, alias)
JOIN styles style ON style.code = alias_data.style_code;

-- 相關風格：搜尋來源風格時，補充目標風格的商品
INSERT INTO style_relations (source_style_id, target_style_id, weight)
SELECT source_style.id, target_style.id, relation_data.weight
FROM (
    VALUES
        (N'japanese',   N'natural',    80),
        (N'japanese',   N'minimal',    75),
        (N'japanese',   N'casual',     60),
        (N'natural',    N'japanese',   80),
        (N'natural',    N'minimal',    75),
        (N'natural',    N'casual',     60),
        (N'minimal',    N'urban_work', 80),
        (N'minimal',    N'japanese',   70),
        (N'minimal',    N'natural',    70),
        (N'casual',     N'sporty',     75),
        (N'casual',     N'japanese',   55),
        (N'sporty',     N'casual',     75),
        (N'urban_work', N'minimal',    80),
        (N'urban_work', N'preppy',     55),
        (N'sweet',      N'preppy',     60),
        (N'sweet',      N'natural',    45),
        (N'preppy',     N'sweet',      60),
        (N'preppy',     N'urban_work', 55),
        (N'preppy',     N'japanese',   50)
) AS relation_data (source_code, target_code, weight)
JOIN styles source_style ON source_style.code = relation_data.source_code
JOIN styles target_style ON target_style.code = relation_data.target_code;
