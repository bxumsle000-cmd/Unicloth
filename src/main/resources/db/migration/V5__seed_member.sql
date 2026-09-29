-- ============================================================================
-- 測試會員：資料庫全新建立時（docker compose down -v 之後）才會被 Flyway 執行一次。
-- 平常重啟 app 時，flyway_schema_history 已記錄 V5 跑過，不會再執行，也不會動到 members。
--
-- 登入帳號：test@unicloth.com
-- 登入密碼：Test1234
-- password_hash 是 BCryptPasswordEncoder 對 "Test1234" 算出來的雜湊（不存明碼）
--
-- 注意：這支檔案跑過之後就不要再修改（Flyway 會比對 checksum，不一致就啟動失敗），
--       要改資料請另開 V6。
-- ============================================================================

-- 加 IF NOT EXISTS：組員既有的資料庫若已註冊過同一個 email，才不會撞到 uk_members_email 而啟動失敗
IF NOT EXISTS (SELECT 1 FROM members WHERE email = N'test@unicloth.com')
    INSERT INTO members (email, password_hash, name, phone, gender, birthday)
    VALUES (N'test@unicloth.com',
            N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO',
            N'測試會員',
            N'0912345678',
            N'male',
            '2000-01-01');
