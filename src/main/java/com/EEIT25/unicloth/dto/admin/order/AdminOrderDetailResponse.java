package com.EEIT25.unicloth.dto.admin.order;

import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;
import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.order.PaymentMethod;
import com.EEIT25.unicloth.enums.order.ShippingMethod;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 訂單物流後台的單筆訂單詳細資料。
 *
 * 清單頁只需要快速辨識訂單；點開訂單時才回傳地址、
 * 金額拆分、付款與物流時間、商品明細，避免列表一次載入太多資料。
 */
public record AdminOrderDetailResponse(
        Long id,
        String orderNo,
        LocalDateTime createdAt,
        String memberEmail,
        String receiverName,
        String receiverPhone,
        String receiverEmail,
        OrderStatus status,
        ShippingMethod shippingMethod,
        String shippingAddress,
        String shippingCarrier,
        String trackingNumber,
        PaymentMethod paymentMethod,
        String note,
        Integer subtotal,
        Integer discount,
        Integer shippingFee,
        Integer total,
        LocalDateTime paidAt,
        LocalDateTime shippedAt,
        LocalDateTime deliveredAt,
        LocalDateTime completedAt,
        List<ItemResponse> items
) {
    /**
     * 將訂單主檔與訂單明細組成前端可直接使用的資料。
     *
     * 商品明細使用 OrderItem 的快照欄位，不讀取目前商品名稱與價格；
     * 這樣商品日後改名、改價或下架，舊訂單仍會保留結帳當時的內容。
     */
    public static AdminOrderDetailResponse from(
            Order order,
            List<OrderItem> orderItems
    ) {
        List<ItemResponse> items = orderItems.stream()
                .map(item -> new ItemResponse(
                        item.getProductName(),
                        item.getColor(),
                        item.getSize(),
                        item.getImageUrl(),
                        item.getUnitPrice(),
                        item.getQty(),
                        item.getTotalPrice()
                ))
                .toList();

        return new AdminOrderDetailResponse(
                order.getId(),
                order.getOrderNo(),
                order.getCreatedAt(),
                order.getMember().getEmail(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getReceiverEmail(),
                order.getStatus(),
                order.getShippingMethod(),
                order.getShippingAddress(),
                order.getShippingCarrier(),
                order.getTrackingNumber(),
                order.getPaymentMethod(),
                order.getNote(),
                order.getSubtotal(),
                order.getDiscount(),
                order.getShippingFee(),
                order.getTotal(),
                order.getPaidAt(),
                order.getShippedAt(),
                order.getDeliveredAt(),
                order.getCompletedAt(),
                items
        );
    }

    /**
     * 訂單中的單一商品快照。
     *
     * totalPrice 是下單當時的單價乘數量，不會因商品現行價格改變。
     */
    public record ItemResponse(
            String productName,
            String color,
            String size,
            String imageUrl,
            Integer unitPrice,
            Integer qty,
            Integer totalPrice
    ) {
    }
}