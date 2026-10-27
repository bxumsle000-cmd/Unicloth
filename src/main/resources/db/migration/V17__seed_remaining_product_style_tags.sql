-- 依商品名稱與分類替剩餘商品批次計算風格標籤。
CREATE TABLE #style_candidates (
                                   product_id BIGINT NOT NULL,
                                   style_code NVARCHAR(50) NOT NULL,
                                   score INT NOT NULL
);

-- 每種風格依商品特徵給予分數。
INSERT INTO #style_candidates (
    product_id,
    style_code,
    score
)
SELECT
    product.id,
    style_rule.style_code,
    style_rule.score
FROM products product
         JOIN categories category
              ON category.id = product.category_id
    CROSS APPLY (
    VALUES (
        CONCAT(
            product.name,
            N' ',
            category.name,
            N' ',
            category.code
        )
    )
) AS product_data(search_text)
CROSS APPLY (
    VALUES
        (
            N'japanese',
            CASE
                WHEN product_data.search_text LIKE N'%繭型%'
                  OR product_data.search_text LIKE N'%寬版%'
                  OR product_data.search_text LIKE N'%寬鬆%'
                  OR product_data.search_text LIKE N'%九分%'
                  OR product_data.search_text LIKE N'%七分%'
                  OR product_data.search_text LIKE N'%亞麻%'
                  OR product_data.search_text LIKE N'%百褶%'
                  OR product_data.search_text LIKE N'%工裝%'
                  OR product_data.search_text LIKE N'%燈芯絨%'
                THEN 90
                ELSE 0
            END
        ),
        (
            N'natural',
            CASE
                WHEN product_data.search_text LIKE N'%亞麻%'
                  OR product_data.search_text LIKE N'%棉麻%'
                  OR product_data.search_text LIKE N'%棉質%'
                  OR product_data.search_text LIKE N'%羊毛%'
                  OR product_data.search_text LIKE N'%喀什米爾%'
                  OR product_data.search_text LIKE N'%燈芯絨%'
                  OR product_data.search_text LIKE N'%刷毛%'
                  OR product_data.search_text LIKE N'%法蘭絨%'
                  OR product_data.search_text LIKE N'%柔軟%'
                  OR product_data.search_text LIKE N'%舒膚%'
                THEN 85
                ELSE 0
            END
        ),
        (
            N'minimal',
            CASE
                WHEN product_data.search_text LIKE N'%圓領%'
                  OR product_data.search_text LIKE N'%V領%'
                  OR product_data.search_text LIKE N'%高領%'
                  OR product_data.search_text LIKE N'%針織%'
                  OR product_data.search_text LIKE N'%T恤%'
                  OR product_data.search_text LIKE N'%背心%'
                  OR product_data.search_text LIKE N'%內衣%'
                  OR product_data.search_text LIKE N'%牛仔褲%'
                  OR product_data.search_text LIKE N'%長褲%'
                  OR product_data.search_text LIKE N'%無袖%'
                  OR product_data.search_text LIKE N'%基本%'
                  OR product_data.search_text LIKE N'%簡約%'
                THEN 75
                ELSE 0
            END
        ),
        (
            N'casual',
            CASE
                WHEN product_data.search_text LIKE N'%休閒%'
                  OR product_data.search_text LIKE N'%牛仔%'
                  OR product_data.search_text LIKE N'%連帽%'
                  OR product_data.search_text LIKE N'%外套%'
                  OR product_data.search_text LIKE N'%短褲%'
                  OR product_data.search_text LIKE N'%家居%'
                  OR product_data.search_text LIKE N'%帽子%'
                  OR product_data.search_text LIKE N'%襪%'
                  OR product_data.search_text LIKE N'%內褲%'
                THEN 70
                ELSE 20
            END
        ),
        (
            N'sporty',
            CASE
                WHEN product_data.search_text LIKE N'%DRY%'
                  OR product_data.search_text LIKE N'%AIRism%'
                  OR product_data.search_text LIKE N'%運動%'
                  OR product_data.search_text LIKE N'%機能%'
                  OR product_data.search_text LIKE N'%防曬%'
                  OR product_data.search_text LIKE N'%防風%'
                  OR product_data.search_text LIKE N'%防潑水%'
                  OR product_data.search_text LIKE N'%彈性%'
                  OR product_data.search_text LIKE N'%束口%'
                  OR product_data.search_text LIKE N'%輕便%'
                  OR product_data.search_text LIKE N'%快乾%'
                  OR product_data.search_text LIKE N'%UV%'
                THEN 95
                ELSE 0
            END
        ),
        (
            N'urban_work',
            CASE
                WHEN product_data.search_text LIKE N'%西裝%'
                  OR product_data.search_text LIKE N'%襯衫%'
                  OR product_data.search_text LIKE N'%POLO%'
                  OR product_data.search_text LIKE N'%風衣%'
                  OR product_data.search_text LIKE N'%大衣%'
                  OR product_data.search_text LIKE N'%開襟%'
                  OR product_data.search_text LIKE N'%針織衫%'
                  OR product_data.search_text LIKE N'%高領%'
                  OR product_data.search_text LIKE N'%長褲%'
                THEN 80
                ELSE 0
            END
        ),
        (
            N'sweet',
            CASE
                WHEN product_data.search_text LIKE N'%洋裝%'
                  OR product_data.search_text LIKE N'%裙%'
                  OR product_data.search_text LIKE N'%蛋糕%'
                  OR product_data.search_text LIKE N'%荷葉%'
                  OR product_data.search_text LIKE N'%蝴蝶結%'
                  OR product_data.search_text LIKE N'%蕾絲%'
                  OR product_data.search_text LIKE N'%抓皺%'
                  OR product_data.search_text LIKE N'%芭蕾%'
                  OR product_data.search_text LIKE N'%短版%'
                THEN 88
                ELSE 0
            END
        ),
        (
            N'preppy',
            CASE
                WHEN product_data.search_text LIKE N'%POLO%'
                  OR product_data.search_text LIKE N'%牛津%'
                  OR product_data.search_text LIKE N'%學院%'
                  OR product_data.search_text LIKE N'%格紋%'
                  OR product_data.search_text LIKE N'%百褶%'
                  OR product_data.search_text LIKE N'%西裝%'
                  OR product_data.search_text LIKE N'%背心%'
                  OR product_data.search_text LIKE N'%開襟%'
                  OR product_data.search_text LIKE N'%針織%'
                THEN 82
                ELSE 0
            END
        )
) AS style_rule(
    style_code,
    score
)
WHERE style_rule.score > 0
  AND NOT EXISTS (
    SELECT 1
    FROM product_styles existing_style
    WHERE existing_style.product_id = product.id
    );

-- 每件商品只取分數最高的兩個風格。
WITH ranked_candidates AS (
    SELECT
        candidate.product_id,
        candidate.style_code,
        ROW_NUMBER() OVER (
            PARTITION BY candidate.product_id
            ORDER BY candidate.score DESC, candidate.style_code
        ) AS style_rank
    FROM #style_candidates candidate
)
INSERT INTO product_styles (
    product_id,
    style_id
)
SELECT
    candidate.product_id,
    style.id
FROM ranked_candidates candidate
         JOIN styles style
              ON style.code = candidate.style_code
WHERE candidate.style_rank <= 2
  AND NOT EXISTS (
    SELECT 1
    FROM product_styles existing_style
    WHERE existing_style.product_id = candidate.product_id
      AND existing_style.style_id = style.id
);

DROP TABLE #style_candidates;