-- 商品加上主圖（縮圖），列表、追蹤清單、購物車直接用，不用再去撈 SKU
-- 各顏色自己的圖還是在 product_variants.url
ALTER TABLE products ADD image_url NVARCHAR(500) NULL;
GO

-- 舊資料回填：每個商品取 id 最小的 SKU 的圖
UPDATE p
SET p.image_url = v.url
FROM products p
CROSS APPLY (
    SELECT TOP 1 url FROM product_variants
    WHERE product_id = p.id
    ORDER BY id
) v;
