-- 搜尋別名：不同說法對應到同一個正式風格。
INSERT INTO style_aliases (style_id, alias)
SELECT style.id, alias_data.alias
FROM (
         VALUES
             (N'japanese', N'日式'),
             (N'japanese', N'日本風'),
             (N'japanese', N'日本系'),
             (N'natural', N'自然系'),
             (N'natural', N'森系'),
             (N'minimal', N'極簡'),
             (N'minimal', N'簡約風'),
             (N'casual', N'日常'),
             (N'casual', N'休閒風'),
             (N'sporty', N'運動'),
             (N'sporty', N'運動休閒'),
             (N'urban_work', N'通勤'),
             (N'urban_work', N'上班穿搭'),
             (N'urban_work', N'都會風'),
             (N'sweet', N'可愛'),
             (N'sweet', N'少女風'),
             (N'sweet', N'甜美風'),
             (N'preppy', N'學院'),
             (N'preppy', N'學院系'),
             (N'preppy', N'英倫學院')
     ) AS alias_data(style_code, alias)
         JOIN styles style
              ON style.code = alias_data.style_code;

-- 相關風格：搜尋來源風格時，補充目標風格的商品。
INSERT INTO style_relations (
    source_style_id,
    target_style_id,
    weight
)
SELECT
    source_style.id,
    target_style.id,
    relation_data.weight
FROM (
         VALUES
             (N'japanese', N'natural', 80),
             (N'japanese', N'minimal', 75),
             (N'japanese', N'casual', 60),
             (N'natural', N'japanese', 80),
             (N'natural', N'minimal', 75),
             (N'natural', N'casual', 60),
             (N'minimal', N'urban_work', 80),
             (N'minimal', N'japanese', 70),
             (N'minimal', N'natural', 70),
             (N'casual', N'sporty', 75),
             (N'casual', N'japanese', 55),
             (N'sporty', N'casual', 75),
             (N'urban_work', N'minimal', 80),
             (N'urban_work', N'preppy', 55),
             (N'sweet', N'preppy', 60),
             (N'sweet', N'natural', 45),
             (N'preppy', N'sweet', 60),
             (N'preppy', N'urban_work', 55),
             (N'preppy', N'japanese', 50)
     ) AS relation_data(
                        source_code,
                        target_code,
                        weight
    )
         JOIN styles source_style
              ON source_style.code =
                 relation_data.source_code
         JOIN styles target_style
              ON target_style.code =
                 relation_data.target_code;