-- ============================================================================
-- V9：商品庫存異動紀錄
--
-- inventory_transactions：
--   一次進貨或盤點操作的主紀錄。
--
-- inventory_transaction_items：
--   該次操作中，每個 SKU 的庫存變化。
-- ============================================================================

CREATE TABLE inventory_transactions (
                                        id         BIGINT IDENTITY(1,1) NOT NULL,
                                        type       NVARCHAR(20)  NOT NULL,
                                        note       NVARCHAR(255) NULL,
                                        staff_id   BIGINT        NOT NULL,
                                        created_at DATETIME2(0)  NOT NULL
        CONSTRAINT df_inventory_transactions_created_at
        DEFAULT SYSDATETIME(),

                                        CONSTRAINT pk_inventory_transactions
                                            PRIMARY KEY (id),

                                        CONSTRAINT ck_inventory_transactions_type
                                            CHECK (
                                                type IN (
                                                         N'RECEIVE',
                                                         N'ADJUSTMENT'
                                                    )
                                                ),

                                        CONSTRAINT fk_inventory_transactions_staff
                                            FOREIGN KEY (staff_id)
                                                REFERENCES staff (id)
);

CREATE INDEX idx_inventory_transactions_created_at
    ON inventory_transactions (created_at DESC);

CREATE INDEX idx_inventory_transactions_staff
    ON inventory_transactions (staff_id);


CREATE TABLE inventory_transaction_items (
                                             id               BIGINT IDENTITY(1,1) NOT NULL,
                                             transaction_id   BIGINT        NOT NULL,
                                             variant_id       BIGINT        NULL,

                                             sku_code         NVARCHAR(50)  NOT NULL,
                                             product_name     NVARCHAR(200) NOT NULL,
                                             color            NVARCHAR(30)  NOT NULL,
                                             size             NVARCHAR(20)  NOT NULL,

                                             quantity_change  INT           NOT NULL,
                                             stock_before     INT           NOT NULL,
                                             stock_after      INT           NOT NULL,

                                             CONSTRAINT pk_inventory_transaction_items
                                                 PRIMARY KEY (id),

                                             CONSTRAINT fk_inventory_items_transaction
                                                 FOREIGN KEY (transaction_id)
                                                     REFERENCES inventory_transactions (id)
                                                     ON DELETE CASCADE,

                                             CONSTRAINT fk_inventory_items_variant
                                                 FOREIGN KEY (variant_id)
                                                     REFERENCES product_variants (id)
                                                     ON DELETE SET NULL,

                                             CONSTRAINT ck_inventory_items_stock_before
                                                 CHECK (stock_before >= 0),

                                             CONSTRAINT ck_inventory_items_stock_after
                                                 CHECK (stock_after >= 0),

                                             CONSTRAINT ck_inventory_items_quantity_change
                                                 CHECK (quantity_change <> 0)
);

CREATE INDEX idx_inventory_items_transaction
    ON inventory_transaction_items (transaction_id);

CREATE INDEX idx_inventory_items_variant
    ON inventory_transaction_items (variant_id);