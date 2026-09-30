-- 訂單狀態改用 OrderStatus enum，DB 存大寫（PENDING / SHIPPED / DELIVERED / PICKED_UP / CANCELLED）
-- 1. 預設值從 N'pending' 換成 N'PENDING'
ALTER TABLE orders DROP CONSTRAINT df_orders_status;
ALTER TABLE orders ADD CONSTRAINT df_orders_status DEFAULT N'PENDING' FOR status;

-- 2. 已經存在的訂單一起轉成大寫
UPDATE orders SET status = UPPER(status);
