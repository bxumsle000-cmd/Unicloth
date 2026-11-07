-- ============================== 商品相關 ==============================

-- categories

-- products

-- product_variants


-- ============================== 商品風格 ==============================

CREATE TABLE styles (
    id   BIGINT IDENTITY(1,1) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(50) NOT NULL,
    CONSTRAINT pk_styles PRIMARY KEY (id),
    CONSTRAINT uk_styles_code UNIQUE (code),
    CONSTRAINT uk_styles_name UNIQUE (name)
);

-- 一件商品可有多個風格，同一風格不可重複標記
CREATE TABLE product_styles (
    product_id BIGINT NOT NULL,
    style_id   BIGINT NOT NULL,
    CONSTRAINT pk_product_styles PRIMARY KEY (product_id, style_id),
    CONSTRAINT fk_product_styles_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_styles_style FOREIGN KEY (style_id) REFERENCES styles (id)
);

-- 別名僅存同義詞；一個搜尋詞可對應多種風格
CREATE TABLE style_aliases (
    style_id BIGINT       NOT NULL,
    alias    NVARCHAR(50) NOT NULL,
    CONSTRAINT pk_style_aliases PRIMARY KEY (style_id, alias),
    CONSTRAINT fk_style_aliases_style FOREIGN KEY (style_id) REFERENCES styles (id) ON DELETE CASCADE,
    CONSTRAINT ck_style_aliases_not_blank CHECK (LEN(LTRIM(RTRIM(alias))) > 0)
);

-- style_relations


-- ============================== 會員相關 ==============================

-- members

-- member_profiles

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


-- ============================== 後台員工 ==============================
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

-- inventory_transactions

-- inventory_transaction_items


-- ============================== 折價券 ==============================

-- coupons

-- member_coupons

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

-- 指定會員的預約要發給誰；target_all = 1 的預約這裡沒有資料
CREATE TABLE coupon_schedule_members (
    schedule_id BIGINT NOT NULL,
    member_id   BIGINT NOT NULL,
    CONSTRAINT pk_coupon_schedule_members PRIMARY KEY (schedule_id, member_id),
    CONSTRAINT fk_csm_schedule FOREIGN KEY (schedule_id) REFERENCES coupon_schedules (id) ON DELETE CASCADE,
    CONSTRAINT fk_csm_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);


-- ============================== 訂單 ==============================

-- orders

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
