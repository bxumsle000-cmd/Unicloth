package com.EEIT25.unicloth.dto;

import com.EEIT25.unicloth.entity.Product;

/**
 * 商品列表上的一張卡片
 *
 * @param slug       商品字串 id，點進商品頁用，例如 men-487511
 * @param name       商品名稱
 * @param price      售價
 * @param origPrice  原價；有值且 > price 就顯示特價
 * @param newArrival 新品標籤
 * @param hot        熱門標籤
 * @param imageUrl   縮圖（第一個 SKU 的圖片），沒有 SKU 時是 null
 */
public record ProductCardResponse(
        String slug,
        String name,
        Integer price,
        Integer origPrice,
        boolean newArrival,
        boolean hot,
        String imageUrl
) {
    public static ProductCardResponse from(Product product, String imageUrl) {
        return new ProductCardResponse(
                product.getSlug(),
                product.getName(),
                product.getPrice(),
                product.getOrigPrice(),
                product.isNewArrival(),
                product.isHot(),
                imageUrl);
    }
}
