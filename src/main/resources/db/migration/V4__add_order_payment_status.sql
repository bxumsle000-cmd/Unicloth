ALTER TABLE orders
    ADD payment_status NVARCHAR(20) NOT NULL
    CONSTRAINT df_orders_payment_status
    DEFAULT N'UNPAID';

ALTER TABLE orders
    ADD ecpay_trade_no NVARCHAR(50) NULL;

CREATE INDEX idx_orders_payment_status
    ON orders (payment_status, created_at);