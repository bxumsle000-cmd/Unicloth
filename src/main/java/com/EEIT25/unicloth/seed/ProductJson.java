package com.EEIT25.unicloth.seed;

import java.util.List;

/**
 * 對應 src/main/resources/data/products.json 裡一筆商品的格式（爬蟲產出）。
 * record 的欄位名稱要跟 JSON 的 key 一模一樣，Jackson 才對得起來。
 */
public record ProductJson(
        String slug,
        String name,
        String mainCategory,
        String subCategory,
        String description,
        Integer price,
        Integer origPrice,
        boolean isNew,
        boolean isHot,
        List<VariantJson> variants
) {
    public record VariantJson(
            String color,
            String colorKey,
            String size,
            String skuCode,
            Integer stock,
            String url
    ) {
    }
}
