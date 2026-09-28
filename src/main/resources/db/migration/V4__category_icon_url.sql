-- 分類加上小圖示（分類選單 / 分類按鈕用），存相對路徑，例如 img/categories/icon-all_men-outer.jpg
-- 刻意不叫 image_url：跟 products.image_url（商品主圖）區分開
-- 目前只有第 2 層（外套類、下身類…）有圖示；性別層與細類沒有，維持 NULL
ALTER TABLE categories ADD icon_url NVARCHAR(500) NULL;
GO

-- 舊資料回填：檔名是 icon- 加分類 code，只填 static/img/categories/ 裡真的有檔案的分類
UPDATE categories
SET icon_url = 'img/categories/icon-' + code + '.jpg'
WHERE code IN (
    'all_women-outer', 'all_women-tops', 'all_women-shirts', 'all_women-knit',
    'all_women-bottoms', 'all_women-dresses-and-skirts', 'all_women-inner-wear', 'all_women-room',
    'all_men-outer', 'all_men-tops', 'all_men-shirts', 'all_men-knit',
    'all_men-bottoms', 'all_men-inner-wear', 'all_men-room', 'all_men-accessories',
    'all_kids-outer', 'all_kids-tops', 'all_kids-knit', 'all_kids-bottoms',
    'all_kids-dresses-and-skirts', 'all_kids-inner-wear', 'all_kids-room', 'all_kids-accesories'
);
