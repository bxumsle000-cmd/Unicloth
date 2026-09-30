package com.EEIT25.unicloth.dto.order;

import com.EEIT25.unicloth.entity.Order;

import java.time.LocalDateTime;

/**
 * 結帳成功後回傳的訂單摘要（給「訂單完成」頁顯示）
 *
 * @param orderNo         訂單編號，例如 UC20260901-8842
 * @param createdAt       訂購日期
 * @param receiverName    收件人
 * @param receiverPhone   收件人手機
 * @param shippingMethod  home（宅配）/ cvs（超商取貨）
 * @param paymentMethod   credit / atm / cod
 * @param shippingAddress 宅配地址或超商門市名
 * @param total           最終金額（商品小計 - 折抵 + 運費）
 */
public record CheckoutResponse(
        String orderNo,
        LocalDateTime createdAt,
        String receiverName,
        String receiverPhone,
        String shippingMethod,
        String paymentMethod,
        String shippingAddress,
        Integer total
) {
    /**
     * @param order 剛存好的訂單
     */
    public static CheckoutResponse from(Order order){
        return new CheckoutResponse(
                order.getOrderNo(),
                order.getCreatedAt(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getShippingMethod(),
                order.getPaymentMethod(),
                order.getShippingAddress(),
                order.getTotal());
    }
}
