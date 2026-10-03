-- 客服單內容限制最多 2000 字，跟 CreateSupportTicketRequest 的 @Size(max = 2000) 一致
-- 另外：客服單狀態只有 IN_PROGRESS / RESOLVED 兩種，V1 註解寫的 PENDING 已不使用
ALTER TABLE support_tickets ALTER COLUMN message NVARCHAR(2000) NOT NULL;
