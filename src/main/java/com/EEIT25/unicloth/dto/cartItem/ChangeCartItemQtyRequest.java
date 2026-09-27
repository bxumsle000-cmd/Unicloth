package com.EEIT25.unicloth.dto.cartItem;

public record ChangeCartItemQtyRequest(
        long cartItemId,
        int qty
) {
}
