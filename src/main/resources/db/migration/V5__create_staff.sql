-- ============================================================================
-- V5：後台員工帳號
--   staff             員工帳號（登入後台用），跟前台會員 members 完全分開
--   staff_departments 員工屬於哪些部門；一個員工可以有多個部門（例如商品部＋行銷）
-- 部門 → 權限的對應是固定的，寫在 Java 的 Department enum，不存資料庫。
-- ============================================================================

CREATE TABLE staff (
    id            BIGINT IDENTITY(1,1) NOT NULL,
    account       NVARCHAR(50)  NOT NULL,      -- 登入帳號，例如 sys01；建立後不能改
    password_hash NVARCHAR(255) NOT NULL,      -- BCrypt 雜湊，絕對不存明碼
    name          NVARCHAR(50)  NOT NULL,
    status        NVARCHAR(20)  NOT NULL CONSTRAINT df_staff_status DEFAULT N'ACTIVE',  -- ACTIVE / DISABLED
    last_login_at DATETIME2(0)  NULL,          -- 還沒登入過是 NULL
    created_at    DATETIME2(0)  NOT NULL CONSTRAINT df_staff_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_staff PRIMARY KEY (id),
    CONSTRAINT uk_staff_account UNIQUE (account)
);

CREATE TABLE staff_departments (
    staff_id   BIGINT       NOT NULL,
    department NVARCHAR(20) NOT NULL,          -- PRODUCT / ORDER / CS / MKT / SYS
    CONSTRAINT pk_staff_departments PRIMARY KEY (staff_id, department),
    CONSTRAINT fk_staff_departments_staff FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
);
GO

-- 第一個系統管理員：沒有他就沒人能進後台新增其他員工
-- password_hash 跟 V1 測試會員一樣，是 BCryptPasswordEncoder 對 "Test1234" 算出來的雜湊
INSERT INTO staff (account, password_hash, name)
VALUES (N'sys01', N'$2a$10$GAymusEV9KVVrW5077/ZS.tuG/io1aQzHMM.Gmo5ALjiH0Hin3ttO', N'系統管理員');

INSERT INTO staff_departments (staff_id, department)
SELECT id, N'SYS' FROM staff WHERE account = N'sys01';
