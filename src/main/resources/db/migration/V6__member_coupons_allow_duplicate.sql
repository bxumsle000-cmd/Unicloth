-- 同一張折價券允許重複領取：拿掉 UNIQUE(member_id, coupon_id)
-- 每領一次就存一筆 member_coupons（各自有 expire_at / used_at / order_id），不另外存數量
ALTER TABLE member_coupons DROP CONSTRAINT uk_member_coupons;
GO

-- 原本的 UNIQUE 順便當作 member_id 的索引；拿掉後補一個，查「我的折價券」才不會掃整張表
CREATE INDEX idx_member_coupons_member ON member_coupons (member_id);
