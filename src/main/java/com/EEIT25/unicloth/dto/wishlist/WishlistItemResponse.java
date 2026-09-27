package com.EEIT25.unicloth.dto.wishlist;

import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.WishlistItem;

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
     * @param wishlistItem 追蹤清單的一筆（商品下架的也會傳進來，onSale 會是 false）
     */
    public static WishlistItemResponse from(WishlistItem wishlistItem){
        Product product = wishlistItem.getProduct();

        return new WishlistItemResponse(product.getSlug(),
                product.getName(),
                product.getPrice(),
                product.getImageUrl(),
                "on_sale".equals(product.getStatus()));
    }
}
