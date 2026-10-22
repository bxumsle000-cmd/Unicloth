ALTER TABLE support_tickets
    ADD reply NVARCHAR(2000) NULL,
    replied_at DATETIME2 NULL,
    resolved_at DATETIME2 NULL;
GO

CREATE INDEX idx_support_tickets_status_created_at
    ON support_tickets (status, created_at DESC);
GO