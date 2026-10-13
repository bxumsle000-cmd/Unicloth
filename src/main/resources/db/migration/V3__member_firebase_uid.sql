-- ============================================================================
-- V3：改用 Firebase（Google）登入
--   - firebase_uid：Firebase 給每個 Google 帳號的唯一 id，之後用它找會員
--   - password_hash 改成可 NULL：用 Google 登入的會員沒有密碼
-- 帳號密碼登入暫時保留，之後拿掉時再另開 migration 刪掉 password_hash。
-- ============================================================================

ALTER TABLE members ALTER COLUMN password_hash NVARCHAR(255) NULL;

ALTER TABLE members ADD firebase_uid NVARCHAR(128) NULL;
GO

-- SQL Server 的 UNIQUE 只允許「一筆」NULL，舊的密碼會員 firebase_uid 都是 NULL，
-- 所以用加了 WHERE 的唯一索引：只檢查有值的列不能重複
CREATE UNIQUE INDEX uk_members_firebase_uid
    ON members (firebase_uid)
    WHERE firebase_uid IS NOT NULL;
