-- 風格使用固定代碼，名稱可調整而不影響商品關聯。
CREATE TABLE styles (
    id BIGINT IDENTITY(1,1) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(50) NOT NULL,
    CONSTRAINT pk_styles PRIMARY KEY (id),
    CONSTRAINT uk_styles_code UNIQUE (code),
    CONSTRAINT uk_styles_name UNIQUE (name)
);
-- 一件商品可有多個風格，同一風格不可重複標記。
CREATE TABLE product_styles (
    product_id BIGINT NOT NULL,
    style_id BIGINT NOT NULL,
    CONSTRAINT pk_product_styles PRIMARY KEY (product_id, style_id),
    CONSTRAINT fk_product_styles_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_styles_style FOREIGN KEY (style_id) REFERENCES styles (id)
);
CREATE INDEX idx_product_styles_style ON product_styles (style_id, product_id);
-- 別名僅存同義詞；一個搜尋詞可對應多種風格。
CREATE TABLE style_aliases (
    style_id BIGINT NOT NULL,
    alias NVARCHAR(50) NOT NULL,
    CONSTRAINT pk_style_aliases PRIMARY KEY (style_id, alias),
    CONSTRAINT fk_style_aliases_style FOREIGN KEY (style_id) REFERENCES styles (id) ON DELETE CASCADE,
    CONSTRAINT ck_style_aliases_not_blank CHECK (LEN(LTRIM(RTRIM(alias))) > 0)
);
CREATE INDEX idx_style_aliases_alias ON style_aliases (alias, style_id);
-- 單向關聯：搜尋來源風格時，可補充目標風格；雙向需各存一筆。
CREATE TABLE style_relations (
    source_style_id BIGINT NOT NULL,
    target_style_id BIGINT NOT NULL,
    weight INT NOT NULL,
    CONSTRAINT pk_style_relations PRIMARY KEY (source_style_id, target_style_id),
    CONSTRAINT fk_style_relations_source FOREIGN KEY (source_style_id) REFERENCES styles (id),
    CONSTRAINT fk_style_relations_target FOREIGN KEY (target_style_id) REFERENCES styles (id),
    CONSTRAINT ck_style_relations_distinct CHECK (source_style_id <> target_style_id),
    CONSTRAINT ck_style_relations_weight CHECK (weight BETWEEN 1 AND 100)
);
CREATE INDEX idx_style_relations_target ON style_relations (target_style_id);
-- 初始風格；商品標記、別名與關聯權重在後續步驟加入。
INSERT INTO styles (code, name) VALUES
    (N'japanese', N'日系'),
    (N'natural', N'自然風'),
    (N'minimal', N'簡約'),
    (N'casual', N'休閒'),
    (N'sporty', N'運動風'),
    (N'urban_work', N'都會通勤'),
    (N'sweet', N'甜美'),
    (N'preppy', N'學院風');

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