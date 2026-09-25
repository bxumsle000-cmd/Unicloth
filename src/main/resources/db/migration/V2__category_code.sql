-- 分類加上固定代碼，給前端與網址用（資料庫 id 每台電腦可能不同，code 不會變）
-- 值直接用 Uniqlo 的分類代碼：all_men / all_men-tops-t-shirts / all_men-tops-t-shirts-anchor01
ALTER TABLE categories ADD code NVARCHAR(100) NULL;
GO

-- 舊資料（爬蟲改版前匯入的兩層分類）沒有 code，所以允許 NULL；有值的才要求不重複
CREATE UNIQUE INDEX uk_categories_code ON categories (code) WHERE code IS NOT NULL;
