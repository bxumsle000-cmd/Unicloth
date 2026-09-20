-- ============================================================================
-- V2__add_member_address.sql  members 加 address 欄位
--
-- 可 NULL、無 DEFAULT：註冊時不一定會填，之後在會員中心補。
-- 長度比照 orders.shipping_address 用 255。
-- ============================================================================

ALTER TABLE members
    ADD address NVARCHAR(255) NULL;
