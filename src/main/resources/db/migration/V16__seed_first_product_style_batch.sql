-- 第一批經圖片與商品名稱確認的風格標籤。
INSERT INTO product_styles (
    product_id,
    style_id
)
SELECT
    product.id,
    style.id
FROM (
         VALUES
             (N'women-488701', N'japanese'),
             (N'women-488701', N'casual'),
             (N'women-483890', N'natural'),
             (N'women-483890', N'minimal'),
             (N'women-484850', N'casual'),
             (N'women-484850', N'preppy'),
             (N'women-487286', N'sweet'),
             (N'women-487286', N'casual'),
             (N'women-487996', N'urban_work'),
             (N'women-487996', N'minimal'),
             (N'women-487855', N'minimal'),
             (N'women-487855', N'urban_work'),
             (N'men-487511', N'sporty'),
             (N'men-487511', N'casual'),
             (N'men-487488', N'minimal'),
             (N'men-487488', N'urban_work'),
             (N'men-486614', N'casual'),
             (N'men-486614', N'urban_work'),
             (N'men-486104', N'natural'),
             (N'men-486104', N'casual'),
             (N'kids-486666', N'preppy'),
             (N'kids-486666', N'sweet'),
             (N'kids-488239', N'sweet')
     ) AS tag_data(
                   product_slug,
                   style_code
    )
         JOIN products product
              ON product.slug = tag_data.product_slug
         JOIN styles style
              ON style.code = tag_data.style_code
WHERE NOT EXISTS (
    SELECT 1
    FROM product_styles existing_tag
    WHERE existing_tag.product_id = product.id
      AND existing_tag.style_id = style.id
);