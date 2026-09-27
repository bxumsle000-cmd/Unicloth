package com.EEIT25.unicloth.dto.category;

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
 * @param imageUrl   縮圖（商品主圖），沒有時是 null
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
    /**
     * @param product 要顯示成卡片的商品（縮圖取 product.imageUrl）
     */
    public static ProductCardResponse from(Product product) {
        return new ProductCardResponse(
                product.getSlug(),
                product.getName(),
                product.getPrice(),
                product.getOrigPrice(),
                product.isNewArrival(),
                product.isHot(),
                product.getImageUrl());
    }
}
