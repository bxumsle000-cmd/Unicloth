
-- =====================================================
-- Unicloth 綠界金流付款紀錄表
-- 每一筆紀錄代表一次付款嘗試
-- =====================================================

CREATE TABLE payments (
    id BIGINT IDENTITY(1,1) NOT NULL,

    -- 對應 Unicloth 訂單
    order_id BIGINT NOT NULL,

    -- 傳給綠界的交易編號，必須唯一
    merchant_trade_no NVARCHAR(20) NOT NULL,

    -- 綠界付款完成後回傳的交易編號
    ecpay_trade_no NVARCHAR(30) NULL,

    -- 付款金額，以新台幣元為單位
    amount INT NOT NULL,

    -- CREDIT / ATM
    payment_method NVARCHAR(20) NOT NULL,

    -- PENDING / PAID / FAILED / CANCELLED
    status NVARCHAR(20) NOT NULL
        CONSTRAINT df_payments_status DEFAULT N'PENDING',

    -- 建立時間
    created_at DATETIME2(0) NOT NULL
        CONSTRAINT df_payments_created_at DEFAULT SYSDATETIME(),

    -- 付款完成時間
    paid_at DATETIME2(0) NULL,

    -- 資料表主鍵
    CONSTRAINT pk_payments PRIMARY KEY (id),

    -- 綠界交易編號不得重複
    CONSTRAINT uk_payments_merchant_trade_no
        UNIQUE (merchant_trade_no),

    -- 關聯 orders 資料表
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders (id),

    -- 金額不可為負數
    CONSTRAINT ck_payments_amount
        CHECK (amount >= 0)
);

-- 加速查詢某張訂單的付款紀錄
CREATE INDEX idx_payments_order_id
ON payments (order_id);

-- 加速依付款狀態查詢
CREATE INDEX idx_payments_status
ON payments (status);
