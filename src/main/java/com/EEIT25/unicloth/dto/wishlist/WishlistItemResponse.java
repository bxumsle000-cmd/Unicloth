package com.EEIT25.unicloth.dto.wishlist;

import com.EEIT25.unicloth.entity.Product;

/**
 * 追蹤清單上的一件商品
 *
 * @param onSale 是否上架中；false 時前端顯示「已下架」、不連到商品頁，但仍可取消追蹤
 */
public record WishlistItemResponse(
        String slug,
        String name,
        int price,
        String imageUrl,
        boolean onSale
) {

    /**
     * @param product 被追蹤的商品（下架的也會傳進來，onSale 會是 false）
     */
    public static WishlistItemResponse from(Product product){
        return new WishlistItemResponse(product.getSlug(),
                product.getName(),
                product.getPrice(),
                product.getImageUrl(),
                "on_sale".equals(product.getStatus()));
    }
}
