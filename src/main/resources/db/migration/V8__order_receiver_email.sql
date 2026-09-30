-- 訂單加上收件人 Email（寄訂單通知用）
-- 已經存在的舊訂單沒有 Email，所以先允許 NULL；新訂單由 CheckoutRequest 的 @NotBlank 擋下空值
ALTER TABLE orders ADD receiver_email NVARCHAR(255) NULL;
