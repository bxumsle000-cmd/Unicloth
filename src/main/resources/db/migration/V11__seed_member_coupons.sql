-- ============================================================================
-- 給 member id = 1 發放預設的兩張測試折價券（V7 建立的 WELCOME100、SAVE10）
-- 全新資料庫時，id = 1 就是 V5 建立的測試會員 test@unicloth.com
--
-- expire_at 的算法跟 CouponService 領券時一樣：領取當下 + valid_days
--
-- 用 INSERT ... SELECT + JOIN：
--   若 id = 1 的會員或券不存在，就什麼都不插入，不會因為 FK 錯誤而啟動失敗
--
-- 注意：這支檔案跑過之後就不要再修改（Flyway 會比對 checksum，不一致就啟動失敗），
--       要改資料請另開 V12。
-- ============================================================================

INSERT INTO member_coupons (member_id, coupon_id, expire_at)
SELECT m.id,
       c.id,
       DATEADD(DAY, c.valid_days, SYSDATETIME())
FROM members m
JOIN coupons c ON c.code IN (N'WELCOME100', N'SAVE10')
WHERE m.id = 1;
