package com.EEIT25.unicloth.dto.cartItem;

public record AddCartItemRequest(
        Long variantId,
        int qty
) {
}
