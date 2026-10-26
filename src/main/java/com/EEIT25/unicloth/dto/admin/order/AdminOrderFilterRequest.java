package com.EEIT25.unicloth.dto.admin.order;

import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.order.ShippingMethod;

public record AdminOrderFilterRequest(
        String keyword,
        OrderStatus status,
        ShippingMethod shippingMethod
) {
}