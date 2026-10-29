package com.EEIT25.unicloth.dto.store.category;

import com.EEIT25.unicloth.dto.store.style.StyleResponse;
import com.EEIT25.unicloth.entity.Product;

import java.util.List;

/**
 * 商品列表上的一張卡片
 *
 * @param slug       商品字串 id
 * @param name       商品名稱
 * @param price      售價
 * @param origPrice  原價
 * @param newArrival 新品標籤
 * @param hot        熱門標籤
 * @param imageUrl   商品縮圖
 * @param styles     商品風格標籤
 */
public record ProductCardResponse(
        String slug,
        String name,
        Integer price,
        Integer origPrice,
        boolean newArrival,
        boolean hot,
        String imageUrl,
        List<StyleResponse> styles
) {
    /**
     * 將商品轉成商品卡片回傳格式。
     */
    public static ProductCardResponse from(Product product) {
        return new ProductCardResponse(
                product.getSlug(),
                product.getName(),
                product.getPrice(),
                product.getOrigPrice(),
                product.isNewArrival(),
                product.isHot(),
                product.getImageUrl(),
                product.getStyles()
                        .stream()
                        .map(StyleResponse::from)
                        .toList());
    }
}