-- 第二批經圖片與商品名稱確認的風格標籤。
INSERT INTO product_styles (
    product_id,
    style_id
)
SELECT
    product.id,
    style.id
FROM (
         VALUES
             (N'men-492035', N'minimal'),
             (N'men-492035', N'urban_work'),
             (N'men-488758', N'minimal'),
             (N'men-488758', N'urban_work'),
             (N'men-486300', N'sporty'),
             (N'men-486300', N'casual'),
             (N'men-488801', N'japanese'),
             (N'men-488801', N'natural'),
             (N'women-488700', N'natural'),
             (N'women-488700', N'casual'),
             (N'women-487995', N'japanese'),
             (N'women-487995', N'natural'),
             (N'women-487001', N'sweet'),
             (N'women-487001', N'minimal'),
             (N'women-483281', N'sporty'),
             (N'women-483281', N'minimal'),
             (N'kids-486675', N'preppy'),
             (N'kids-486675', N'casual'),
             (N'kids-483406', N'sporty'),
             (N'kids-483406', N'casual'),
             (N'kids-486668', N'natural'),
             (N'kids-486668', N'preppy'),
             (N'kids-490470', N'urban_work'),
             (N'kids-490470', N'casual')
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