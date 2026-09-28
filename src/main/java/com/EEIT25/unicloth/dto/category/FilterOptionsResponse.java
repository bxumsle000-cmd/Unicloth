package com.EEIT25.unicloth.dto.category;

import java.util.List;

/**
 * 分類頁的篩選選項（依這個分類實際有的商品產生，不是寫死的）
 *
 * @param colors 顏色（資料庫原樣，不重複）
 * @param sizes  尺寸（資料庫原樣，不重複）
 */
public record FilterOptionsResponse(
        List<String> colors,
        List<String> sizes
) {
}
