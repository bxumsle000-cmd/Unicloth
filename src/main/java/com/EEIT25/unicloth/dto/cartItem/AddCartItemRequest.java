package com.EEIT25.unicloth.dto.cartItem;

/**
 * 加入購物車
 *
 * @param variantId 要加入的 SKU id
 * @param qty       要加入的數量；購物車已有同一個 SKU 時，會加在原本的數量上
 */
public record AddCartItemRequest(
        Long variantId,
        int qty
) {
}
