package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.order.AdminOrderDetailResponse;
import com.EEIT25.unicloth.dto.admin.order.AdminOrderFilterRequest;
import com.EEIT25.unicloth.dto.admin.order.AdminOrderListResponse;
import com.EEIT25.unicloth.dto.admin.order.ShipOrderRequest;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;
import com.EEIT25.unicloth.entity.Payment;
import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.order.PaymentStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.repository.PaymentRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 訂單物流後台服務。
 */
@Service
@RequiredArgsConstructor
public class AdminOrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PaymentRepository paymentRepository;

    /**
     * 依關鍵字、訂單狀態、配送方式取得後台訂單列表。
     */
    @Transactional(readOnly = true)
    public Page<AdminOrderListResponse> getOrders(
            AdminOrderFilterRequest filter,
            Pageable pageable
    ) {
        String keyword = filter.keyword() == null ? "" : filter.keyword().trim();

        Page<Order> orders = orderRepository.findByAdminFilter(
                keyword,
                filter.status(),
                filter.shippingMethod(),
                pageable
        );

        return orders.map(AdminOrderListResponse::from);
    }

    /**
     * 取得一筆訂單的完整物流與商品明細。
     */
    @Transactional(readOnly = true)
    public AdminOrderDetailResponse getOrder(Long orderId) {
        Order order = findOrder(orderId);
        return AdminOrderDetailResponse.from(
                order,
                orderItemRepository.findByOrderId(orderId)
        );
    }

    /**
     * 將待出貨訂單改為已出貨，並留下物流商、追蹤碼與出貨時間。
     */
    @Transactional
    public AdminOrderDetailResponse shipOrder(
            Long orderId,
            ShipOrderRequest request
    ) {
        Order order = findOrder(orderId);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw ApiException.conflict(
                    "只有「訂單確認中」的訂單可以出貨，目前狀態為："
                            + order.getStatus().getLabel()
            );
        }

        order.setShippingCarrier(request.shippingCarrier().trim());
        order.setTrackingNumber(request.trackingNumber().trim());
        order.setStatus(OrderStatus.SHIPPED);
        order.setShippedAt(LocalDateTime.now());

        return toDetailResponse(order);
    }

    /**
     * 取消尚未出貨的訂單。
     *
     * 取消時會回補商品庫存、釋放優惠券，並取消尚未付款的付款紀錄。
     * 若訂單已付款，金流紀錄會保留為 PAID，退款須由外部金流流程處理。
     */
    @Transactional
    public AdminOrderDetailResponse cancelOrder(Long orderId) {
        Order order = findOrder(orderId);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw ApiException.conflict(
                    "只有「訂單確認中」且尚未出貨的訂單可以取消，目前狀態為："
                            + order.getStatus().getLabel()
            );
        }

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);

        // 商品規格仍存在時，才有可回補的庫存。
        for (OrderItem orderItem : orderItems) {
            if (orderItem.getVariant() != null) {
                productVariantRepository.restoreStock(
                        orderItem.getVariant().getId(),
                        orderItem.getQty()
                );
            }
        }

        // 折價券取消綁定後，會員可再次使用尚未過期的券。
        MemberCoupon memberCoupon = order.getMemberCoupon();
        if (memberCoupon != null) {
            memberCoupon.setUsedAt(null);
            memberCoupon.setOrder(null);
        }

        // 尚未付款的付款紀錄可以直接取消；已付款紀錄保留作為退款依據。
        List<Payment> pendingPayments = paymentRepository.findByOrderIdAndStatus(
                orderId,
                PaymentStatus.PENDING
        );
        for (Payment payment : pendingPayments) {
            payment.setStatus(PaymentStatus.CANCELLED);
        }

        order.setStatus(OrderStatus.CANCELLED);

        return AdminOrderDetailResponse.from(order, orderItems);
    }

    /**
     * 將已出貨訂單改為已送達，並記錄實際確認送達的時間。
     */
    @Transactional
    public AdminOrderDetailResponse markDelivered(Long orderId) {
        Order order = findOrder(orderId);

        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw ApiException.conflict(
                    "只有「已出貨」的訂單可以確認送達，目前狀態為："
                            + order.getStatus().getLabel()
            );
        }

        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());

        return toDetailResponse(order);
    }

    /**
     * 手動確認會員已取貨。
     *
     * 完成時間由後端產生，前端只負責提出確認取貨的要求。
     */
    @Transactional
    public AdminOrderDetailResponse markPickedUp(Long orderId) {
        Order order = findOrder(orderId);

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw ApiException.conflict(
                    "只有「已送達」的訂單可以確認取貨，目前狀態為："
                            + order.getStatus().getLabel()
            );
        }

        order.setStatus(OrderStatus.PICKED_UP);
        order.setCompletedAt(LocalDateTime.now());

        return toDetailResponse(order);
    }

    /**
     * 將訂單與商品明細轉成前端需要的詳細資料。
     */
    private AdminOrderDetailResponse toDetailResponse(Order order) {
        return AdminOrderDetailResponse.from(
                order,
                orderItemRepository.findByOrderId(order.getId())
        );
    }

    /**
     * 集中處理找不到訂單的情況，避免每個功能重複相同的查詢程式。
     */
    private Order findOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("找不到訂單：" + orderId));
    }
}