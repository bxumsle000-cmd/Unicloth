-- 記錄每位會員瀏覽各商品的累積次數。
CREATE TABLE member_product_views (
                                      id BIGINT IDENTITY(1,1) NOT NULL,
                                      member_id BIGINT NOT NULL,
                                      product_id BIGINT NOT NULL,
                                      view_count INT NOT NULL CONSTRAINT df_member_product_views_count DEFAULT 1,
                                      first_viewed_at DATETIME2(0) NOT NULL CONSTRAINT df_member_product_views_first DEFAULT SYSDATETIME(),
                                      last_viewed_at DATETIME2(0) NOT NULL CONSTRAINT df_member_product_views_last DEFAULT SYSDATETIME(),
                                      CONSTRAINT pk_member_product_views PRIMARY KEY (id),
                                      CONSTRAINT uk_member_product_views_member_product UNIQUE (member_id, product_id),
                                      CONSTRAINT fk_member_product_views_member FOREIGN KEY (member_id)
                                          REFERENCES members (id) ON DELETE CASCADE,
                                      CONSTRAINT fk_member_product_views_product FOREIGN KEY (product_id)
                                          REFERENCES products (id) ON DELETE CASCADE
);

-- 查詢會員最近瀏覽與偏好時使用。
CREATE INDEX idx_member_product_views_recent
    ON member_product_views (member_id, last_viewed_at DESC);

-- 計算商品瀏覽熱度時使用。
CREATE INDEX idx_member_product_views_popularity
    ON member_product_views (product_id, view_count DESC);