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
