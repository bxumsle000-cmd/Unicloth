-- ============================================================================
-- V13：行銷後台折價券、會員改用 Google 登入
--   1. coupons：is_signup_gift 改成 auto_trigger（自動發送時機）
--   2. member_coupons：加 source（這張券怎麼來的）
--   3. 新增 coupon_schedules / coupon_schedule_members（預約發送）
--   4. members：拿掉 password_hash（會員只能用 Google（Firebase）登入）
-- ============================================================================

-- ---------- 1. coupons ----------
ALTER TABLE coupons ADD auto_trigger NVARCHAR(20) NULL;   -- BIRTHDAY；NULL = 只能手動發
GO

-- 欄位有 DEFAULT 約束時，要先刪約束才能刪欄位
ALTER TABLE coupons DROP CONSTRAINT df_coupons_is_signup_gift;
ALTER TABLE coupons DROP COLUMN is_signup_gift;

-- ---------- 2. member_coupons ----------
-- 舊資料都是手動發的，DEFAULT 會自動補成 MANUAL
ALTER TABLE member_coupons ADD source NVARCHAR(20) NOT NULL
    CONSTRAINT df_mc_source DEFAULT N'MANUAL';   -- MANUAL / BIRTHDAY

-- 發券紀錄頁：依發券日期篩選、排序
CREATE INDEX idx_member_coupons_received_at ON member_coupons (received_at);

-- ---------- 3. 預約發送 ----------
-- 立即發送不存這裡，直接寫進 member_coupons
CREATE TABLE coupon_schedules (
    id           BIGINT IDENTITY(1,1) NOT NULL,
    coupon_id    BIGINT       NOT NULL,
    target_all   BIT          NOT NULL,        -- 1 = 全部會員（發送當下的會員）；0 = 看 coupon_schedule_members
    scheduled_at DATETIME2(0) NOT NULL,        -- 預約時間
    status       NVARCHAR(20) NOT NULL CONSTRAINT df_cs_status DEFAULT N'PENDING',  -- PENDING / SENT / FAILED / CANCELLED
    sent_at      DATETIME2(0) NULL,            -- 實際發出的時間
    sent_count   INT          NULL,            -- 實際發了幾位
    created_by   BIGINT       NOT NULL,        -- 建立預約的員工
    created_at   DATETIME2(0) NOT NULL CONSTRAINT df_cs_created_at DEFAULT SYSDATETIME(),
    CONSTRAINT pk_coupon_schedules PRIMARY KEY (id),
    CONSTRAINT fk_cs_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id),
    CONSTRAINT fk_cs_staff FOREIGN KEY (created_by) REFERENCES staff (id)
);
-- 排程每次查「等待中、時間到了」的預約用
CREATE INDEX idx_coupon_schedules_status_time ON coupon_schedules (status, scheduled_at);

-- 指定會員的預約要發給誰；target_all = 1 的預約這裡沒有資料
CREATE TABLE coupon_schedule_members (
    schedule_id BIGINT NOT NULL,
    member_id   BIGINT NOT NULL,
    CONSTRAINT pk_coupon_schedule_members PRIMARY KEY (schedule_id, member_id),
    CONSTRAINT fk_csm_schedule FOREIGN KEY (schedule_id) REFERENCES coupon_schedules (id) ON DELETE CASCADE,
    CONSTRAINT fk_csm_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);

-- ---------- 4. members ----------
-- 員工（staff.password_hash）還是用帳號密碼登入，不受影響
ALTER TABLE members DROP COLUMN password_hash;
