package com.EEIT25.unicloth.seed;

import java.util.List;

/**
 * 對應 src/main/resources/data/products.json 裡一筆商品的格式（爬蟲產出）。
 * record 的欄位名稱要跟 JSON 的 key 一模一樣，Jackson 才對得起來。
 *
 * 分類是三層：性別 › 大類 › 細類，名稱和代碼一一對應
 *   categoryPath = ["男裝", "T恤/背心", "長袖"]
 *   categoryCode = ["all_men", "all_men-tops-t-shirts", "all_men-tops-t-shirts-anchor01"]
 */
public record ProductJson(
        String slug,
        String name,
        List<String> categoryPath,
        List<String> categoryCode,
        List<String> alsoIn,          // 這件商品也出現在哪些細類（材質、版型…），只留在 JSON，不匯入資料庫
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
