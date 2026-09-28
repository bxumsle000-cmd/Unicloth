package com.EEIT25.unicloth.dto.product;

import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 商品詳細頁
 *
 * @param slug         商品字串 id，例如 men-487511
 * @param name         商品名稱
 * @param description  商品描述，可能是 null
 * @param price        售價
 * @param origPrice    原價；有值且 > price 就顯示特價
 * @param colorOptions 顏色選項（SKU 依顏色分組），每個顏色底下帶各尺寸
 */
public record ProductDetailResponse(
        String slug,
        String name,
        String description,
        Integer price,
        Integer origPrice,
        List<ColorOption> colorOptions
) {
    /**
     * @param product  要顯示的商品
     * @param variants 這個商品的所有 SKU（依 id 排好），這裡會依顏色分組
     */
    public static ProductDetailResponse from(Product product,
                                             List<ProductVariant> variants) {
        // 顏色 → 該顏色的 SKU 們；用 LinkedHashMap 保持第一次出現的順序
        Map<String, List<ProductVariant>> colorMap = new LinkedHashMap<>();
        for (ProductVariant v : variants) {
            colorMap.computeIfAbsent(v.getColor(), k -> new ArrayList<>()).add(v);
        }

        // 每個顏色的 SKU 轉成一個 ColorOption，底下帶各尺寸
        List<ColorOption> colorOptions = new ArrayList<>();
        for (Map.Entry<String, List<ProductVariant>> entry : colorMap.entrySet()) {
            colorOptions.add(ColorOption.from(entry.getKey(), entry.getValue()));
        }

        return new ProductDetailResponse(
                product.getSlug(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getOrigPrice(),
                colorOptions);
    }

    /**
     * 一個顏色
     *
     * @param color    顏色名稱，例如 黑色
     * @param imageUrl 這個顏色的圖片（同顏色的 SKU 圖片相同，取第一個）
     * @param sizeOptions 這個顏色有的尺寸
     */
    public record ColorOption(
            String color,
            String imageUrl,
            List<SizeOption> sizeOptions
    ) {
        /**
         * @param color     顏色名稱，例如 黑色
         * @param sameColor 這個顏色的所有 SKU（不能是空的，會取第一個的圖片）
         */
        private static ColorOption from(String color, List<ProductVariant> sameColor) {
            List<SizeOption> sizeOptions = sameColor.stream().map(SizeOption::from).toList();
            String imageUrl = sameColor.get(0).getUrl();   // 同顏色圖片一樣，取第一個
            return new ColorOption(color, imageUrl, sizeOptions);
        }
    }

    /**
     * 某顏色底下的一個尺寸，也就是一個 SKU
     *
     * @param variantId 加入購物車時送出的 SKU id
     * @param size      尺寸，例如 M
     * @param stock     庫存；0 代表缺貨，前端按鈕反灰
     */
    public record SizeOption(
            Long variantId,
            String size,
            Integer stock
    ) {
        /**
         * @param variant 某顏色底下的一個 SKU
         */
        private static SizeOption from(ProductVariant variant) {
            return new SizeOption(variant.getId(), variant.getSize(), variant.getStock());
        }
    }
}
