-- ============================================================================
-- V14：移除「註冊禮」
--   程式裡的 enum 已經拿掉 SIGNUP，DB 裡還存著 SIGNUP 的話，讀出來會轉不回 enum
--   1. coupons：auto_trigger = SIGNUP 的券改成只能手動發
--   2. member_coupons：source = SIGNUP 的紀錄改成 MANUAL
-- ============================================================================

UPDATE coupons SET auto_trigger = NULL WHERE auto_trigger = N'SIGNUP';

UPDATE member_coupons SET source = N'MANUAL' WHERE source = N'SIGNUP';
