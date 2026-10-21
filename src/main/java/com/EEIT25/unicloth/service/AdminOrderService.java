package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.admin.order.AdminOrderDetailResponse;
import com.EEIT25.unicloth.dto.admin.order.AdminOrderFilterRequest;
import com.EEIT25.unicloth.dto.admin.order.AdminOrderListResponse;
import com.EEIT25.unicloth.dto.admin.order.ShipOrderRequest;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import com.EEIT25.unicloth.repository.OrderRepository;
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

    /**
     * 依關鍵字、訂單狀態、配送方式取得後台訂單列表。
     */
    @Transactional(readOnly = true)
    public Page<AdminOrderListResponse> getOrders(
            AdminOrderFilterRequest filter,
            Pageable pageable
    ) {
        String keyword = filter.keyword() == null
                ? ""
                : filter.keyword().trim();

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
     * 只允許 PENDING 訂單出貨，避免已取消、已出貨的訂單被重複修改。
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

        return AdminOrderDetailResponse.from(
                order,
                orderItemRepository.findByOrderId(orderId)
        );
    }

    /**
     * 將已出貨訂單改為已送達，並記錄實際確認送達的時間。
     * 只有 SHIPPED 可進入 DELIVERED，確保訂單流程不會跳過出貨階段。
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

        return AdminOrderDetailResponse.from(
                order,
                orderItemRepository.findByOrderId(orderId)
        );
    }

    /**
     * 集中處理找不到訂單的情況，避免每個功能重複相同的查詢程式。
     */
    private Order findOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound(
                        "找不到訂單：" + orderId
                ));
    }
}