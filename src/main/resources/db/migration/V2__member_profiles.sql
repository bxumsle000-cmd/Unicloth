-- ============================================================================
-- V2：會員拆成兩張表
--   members         帳號（登入用）：email、密碼、狀態
--   member_profiles 個人資料（補填用）：姓名、電話、性別、生日、地址
-- 一個會員最多一筆個人資料（一對一），member_id 同時是 PK 和 FK。
-- 之後改 Google 登入時，第一次登入只會建 members，補填完才建 member_profiles，
-- 所以「有沒有 profile」就代表「資料補齊了沒」。
-- ============================================================================

CREATE TABLE member_profiles (
    member_id BIGINT        NOT NULL,
    name      NVARCHAR(50)  NOT NULL,
    phone     NVARCHAR(20)  NOT NULL,
    gender    NVARCHAR(10)  NOT NULL,      -- male / female
    birthday  DATE          NOT NULL,
    address   NVARCHAR(255) NULL,          -- 可 NULL；結帳時當宅配地址的預設值
    CONSTRAINT pk_member_profiles PRIMARY KEY (member_id),
    CONSTRAINT fk_profiles_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);

-- 把現有會員的個人資料搬過去
INSERT INTO member_profiles (member_id, name, phone, gender, birthday, address)
SELECT id, name, phone, gender, birthday, address
FROM members;

-- 搬完再從 members 移除這些欄位
ALTER TABLE members DROP COLUMN name, phone, gender, birthday, address;
