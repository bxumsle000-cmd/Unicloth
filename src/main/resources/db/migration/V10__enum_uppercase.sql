-- 以下欄位改用 enum，DB 存大寫（做法同 V9）
--   products.status        → ProductStatus  （ON_SALE / OFF_SHELF）
--   members.status         → MemberStatus   （ACTIVE / DISABLED）
--   coupons.type           → CouponType     （AMOUNT / PERCENT）
--   orders.shipping_method → ShippingMethod （HOME / CVS）
--   orders.payment_method  → PaymentMethod  （CREDIT / ATM / COD）

-- 1. 有預設值的欄位，預設值換成大寫
ALTER TABLE products DROP CONSTRAINT df_products_status;
ALTER TABLE products ADD CONSTRAINT df_products_status DEFAULT N'ON_SALE' FOR status;

ALTER TABLE members DROP CONSTRAINT df_members_status;
ALTER TABLE members ADD CONSTRAINT df_members_status DEFAULT N'ACTIVE' FOR status;

-- 2. 已經存在的資料一起轉成大寫（包含 V5、V7 種子資料）
UPDATE products SET status = UPPER(status);
UPDATE members  SET status = UPPER(status);
UPDATE coupons  SET type = UPPER(type);
UPDATE orders   SET shipping_method = UPPER(shipping_method),
                    payment_method  = UPPER(payment_method);
