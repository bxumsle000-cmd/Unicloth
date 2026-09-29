-- ============================================================================
-- 測試用折價券：amount（折固定金額）、percent（打折）各一張
--
-- 備註：不需要 shipping（免運券）類型，這裡不建立。
--       coupons.type 欄位雖然註解列了 shipping，但目前只使用 amount / percent。
--
-- 注意：這支檔案跑過之後就不要再修改（Flyway 會比對 checksum，不一致就啟動失敗），
--       要改資料請另開 V8。
-- ============================================================================

-- 加 IF NOT EXISTS：組員既有的資料庫若已手動建過同一個 code，才不會撞到 uk_coupons_code 而啟動失敗

-- amount：滿 990 折 100 元，領取後 30 天內有效
IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = N'WELCOME100')
    INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, is_signup_gift, is_active)
    VALUES (N'WELCOME100', N'新會員 100 元折價券', N'amount', 100, 990, 30, 0, 1);

-- percent：滿 1490 打 9 折（value = 10 代表折 10%），領取後 14 天內有效
IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = N'SAVE10')
    INSERT INTO coupons (code, title, type, value, min_subtotal, valid_days, is_signup_gift, is_active)
    VALUES (N'SAVE10', N'全館 9 折券', N'percent', 10, 1490, 14, 0, 1);
