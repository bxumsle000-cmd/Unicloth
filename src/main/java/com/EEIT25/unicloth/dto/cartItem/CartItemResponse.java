package com.EEIT25.unicloth.dto.cartItem;

import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;

/**
 * 購物車上的一筆
 *
 * @param id     購物車這一筆的 id；改數量、刪除時前端要傳回來
 * @param slug   商品頁網址用
 * @param stock  這個 SKU 的庫存；前端可限制數量上限或顯示庫存不足
 * @param onSale 商品是否上架中；false 時前端顯示「已下架」、不能結帳
 */
public record CartItemResponse(
        Long id,
        String slug,
        String imageUrl,
        String name,
        String color,
        String size,
        int price,
        int qty,
        int stock,
        boolean onSale
) {

    public static CartItemResponse from(CartItem cartItem){
        ProductVariant productVariant = cartItem.getVariant();
        Product product = productVariant.getProduct();

        return new CartItemResponse(
                cartItem.getId(),
                product.getSlug(),
                productVariant.getUrl(),
                product.getName(),
                productVariant.getColor(),
                productVariant.getSize(),
                product.getPrice(),
                cartItem.getQty(),
                productVariant.getStock(),
                "on_sale".equals(product.getStatus()));
    }
}
