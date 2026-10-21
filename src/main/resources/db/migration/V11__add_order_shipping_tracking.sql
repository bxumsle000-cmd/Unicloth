ALTER TABLE orders
    ADD shipping_carrier NVARCHAR(50) NULL,
    tracking_number NVARCHAR(100) NULL,
    delivered_at DATETIME2 NULL;
GO

CREATE INDEX idx_orders_status_created_at
    ON orders (status, created_at DESC);
GO