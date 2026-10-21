package com.EEIT25.unicloth.dto.admin.order;

import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.ShippingMethod;

public record AdminOrderFilterRequest(
        String keyword,
        OrderStatus status,
        ShippingMethod shippingMethod
) {
}