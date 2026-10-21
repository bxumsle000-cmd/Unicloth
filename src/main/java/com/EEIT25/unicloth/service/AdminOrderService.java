package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.admin.order.AdminOrderFilterRequest;
import com.EEIT25.unicloth.dto.admin.order.AdminOrderListResponse;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 訂單物流後台服務。
 */
@Service
@RequiredArgsConstructor
public class AdminOrderService {
    private final OrderRepository orderRepository;

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
}