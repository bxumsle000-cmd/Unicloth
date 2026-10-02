package com.EEIT25.unicloth.dto.order;

import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;

import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        String orderNo,
        LocalDateTime createdAt,
        String receiverName,
        String receiverPhone,
        String shippingMethod,
        String paymentMethod,
        String shippingAddress,
        Integer total,
        String status,
        String note,
        List<OrderItemResponse> orderItemResponseList
) {
    public static OrderResponse from(Order order, List<OrderItem> orderItemList){
        List<OrderItemResponse> orderItemResponseList = orderItemList.stream().map(orderItem ->
                {return OrderItemResponse.from(orderItem);})
                .toList();
        return new OrderResponse(
                order.getOrderNo(),
                order.getCreatedAt(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getShippingMethod().name(),
                order.getPaymentMethod().name(),
                order.getShippingAddress(),
                order.getTotal(),
                order.getStatus().name(),
                order.getNote(),
                orderItemResponseList);
    }
}
