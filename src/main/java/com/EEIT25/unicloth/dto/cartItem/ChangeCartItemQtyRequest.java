package com.EEIT25.unicloth.dto.cartItem;

/**
 * 修改購物車某一筆的數量
 *
 * @param cartItemId 購物車這一筆的 id（CartItemResponse 的 id）
 * @param qty        改成的數量（直接覆蓋，不是加減）
 */
public record ChangeCartItemQtyRequest(
        long cartItemId,
        int qty
) {
}
