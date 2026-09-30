package com.EEIT25.unicloth.dto.order;

import com.EEIT25.unicloth.entity.OrderItem;

public record OrderItemResponse(
        String productName,
        String color,
        String size,
        String imageUrl,
        int qty,
        int totalPrice
) {
    public static OrderItemResponse from(OrderItem orderItem) {
        return new OrderItemResponse(
                orderItem.getProductName(),
                orderItem.getColor(),
                orderItem.getSize(),
                orderItem.getImageUrl(),
                orderItem.getQty(),
                orderItem.getTotalPrice());
    }
}