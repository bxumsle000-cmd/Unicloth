-- ============================================================================
-- 刪掉 DemoDataSeeder 塞的假資料。刪完重開 Spring Boot，會用今天的日期重新產生。
-- 用 SSMS 開這個檔案、選 Unicloth 資料庫後執行。
--
-- 會一起刪掉的：
--   - 假會員（email 是 @demo.unicloth.com）和他們的訂單、付款、折價券、購物車、追蹤清單
--   - 假會員和訪客（也是 @demo.unicloth.com）的客服單
--   - 示範折價券（BDAY200、DOUBLE11、SUMMER150、VIP300、SPRING12）的預約發送紀錄
--   - 備註是「新品到貨 / 熱銷商品補貨 / 廠商週期補貨 / 季節商品備貨」的入庫單（跟 DemoDataSeeder 的 RECEIVE_NOTE_LIST 一樣）
-- 不刪的：
--   - 示範折價券本身（重新產生時會沿用，不會重複建）
-- ============================================================================

BEGIN TRANSACTION;

-- 1. 假會員的訂單（order_items 會跟著 ON DELETE CASCADE 刪掉）
DELETE p FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN members m ON m.id = o.member_id
WHERE m.email LIKE '%@demo.unicloth.com';

UPDATE mc SET order_id = NULL
FROM member_coupons mc
    JOIN members m ON m.id = mc.member_id
WHERE m.email LIKE '%@demo.unicloth.com';

DELETE o FROM orders o
    JOIN members m ON m.id = o.member_id
WHERE m.email LIKE '%@demo.unicloth.com';

-- 2. 客服單
DELETE FROM support_tickets WHERE email LIKE '%@demo.unicloth.com';

-- 3. 示範折價券的預約發送（coupon_schedule_members 會跟著刪掉）
DELETE FROM coupon_schedules
WHERE coupon_id IN (SELECT id FROM coupons WHERE code IN ('BDAY200', 'DOUBLE11', 'SUMMER150', 'VIP300', 'SPRING12'));

-- 4. 假會員（member_profiles、member_coupons、cart_items、wishlist_items 會跟著刪掉）
DELETE FROM members WHERE email LIKE '%@demo.unicloth.com';

-- 5. 示範的入庫單（inventory_transaction_items 會跟著刪掉）
DELETE FROM inventory_transactions
WHERE type = 'RECEIVE'
  AND note IN (N'新品到貨', N'熱銷商品補貨', N'廠商週期補貨', N'季節商品備貨');

COMMIT;
