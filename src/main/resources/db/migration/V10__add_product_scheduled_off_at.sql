/*
 * 商品自動下架時間。
 *
 * NULL：不設定自動下架。
 * 有時間：到達指定時間後，後端排程會自動下架。
 */
ALTER TABLE products
    ADD scheduled_off_at DATETIME2 NULL;
GO

/*
 * 後端排程依商品狀態與下架時間查詢。
 */
CREATE INDEX idx_products_scheduled_off
    ON products (
                 status,
                 scheduled_off_at
        )
    WHERE scheduled_off_at IS NOT NULL;
GO