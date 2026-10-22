package com.EEIT25.unicloth.dto.product;

import com.EEIT25.unicloth.dto.style.StyleResponse;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 商品詳細頁
 *
 * @param slug         商品字串 id
 * @param name         商品名稱
 * @param description  商品描述
 * @param price        售價
 * @param origPrice    原價
 * @param styles       商品風格標籤
 * @param colorOptions 顏色與尺寸選項
 */
public record ProductDetailResponse(
        String slug,
        String name,
        String description,
        Integer price,
        Integer origPrice,
        List<StyleResponse> styles,
        List<ColorOption> colorOptions
) {
    /**
     * 將商品與 SKU 轉成詳細頁回傳格式。
     */
    public static ProductDetailResponse from(
            Product product,
            List<ProductVariant> variants
    ) {
        // 依照顏色將 SKU 分組
        Map<String, List<ProductVariant>> colorMap = new LinkedHashMap<>();
        for (ProductVariant variant : variants) {
            colorMap.computeIfAbsent(
                    variant.getColor(),
                    key -> new ArrayList<>()
            ).add(variant);
        }

        // 將每個顏色轉成顏色選項
        List<ColorOption> colorOptions = new ArrayList<>();
        for (Map.Entry<String, List<ProductVariant>> entry : colorMap.entrySet()) {
            colorOptions.add(
                    ColorOption.from(entry.getKey(), entry.getValue())
            );
        }

        // 將風格 Entity 轉成回傳格式
        List<StyleResponse> styles = product.getStyles()
                .stream()
                .map(StyleResponse::from)
                .toList();

        return new ProductDetailResponse(
                product.getSlug(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getOrigPrice(),
                styles,
                colorOptions);
    }

    /**
     * 一個顏色及其尺寸選項。
     */
    public record ColorOption(
            String color,
            String imageUrl,
            List<SizeOption> sizeOptions
    ) {
        /**
         * 將相同顏色的 SKU 轉成顏色選項。
         */
        private static ColorOption from(
                String color,
                List<ProductVariant> sameColor
        ) {
            List<SizeOption> sizeOptions = sameColor.stream()
                    .map(SizeOption::from)
                    .toList();

            // 相同顏色使用第一個 SKU 的圖片
            String imageUrl = sameColor.get(0).getUrl();
            return new ColorOption(color, imageUrl, sizeOptions);
        }
    }

    /**
     * 某個顏色底下的一個尺寸。
     */
    public record SizeOption(
            Long variantId,
            String size,
            Integer stock
    ) {
        /**
         * 將 SKU 轉成尺寸選項。
         */
        private static SizeOption from(ProductVariant variant) {
            return new SizeOption(
                    variant.getId(),
                    variant.getSize(),
                    variant.getStock()
            );
        }
    }
}