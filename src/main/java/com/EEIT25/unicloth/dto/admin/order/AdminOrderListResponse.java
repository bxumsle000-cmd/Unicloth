package com.EEIT25.unicloth.dto.admin.order;

import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.ShippingMethod;
import java.time.LocalDateTime;

public record AdminOrderListResponse(
        Long id,
        String orderNo,
        LocalDateTime createdAt,
        String memberEmail,
        String receiverName,
        String receiverPhone,
        OrderStatus status,
        ShippingMethod shippingMethod,
        PaymentMethod paymentMethod,
        String shippingCarrier,
        String trackingNumber,
        Integer total
) {
    public static AdminOrderListResponse from(Order order) {
        return new AdminOrderListResponse(
                order.getId(),
                order.getOrderNo(),
                order.getCreatedAt(),
                order.getMember().getEmail(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getStatus(),
                order.getShippingMethod(),
                order.getPaymentMethod(),
                order.getShippingCarrier(),
                order.getTrackingNumber(),
                order.getTotal()
        );
    }
}