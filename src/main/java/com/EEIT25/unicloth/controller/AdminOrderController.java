package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.admin.order.AdminOrderFilterRequest;
import com.EEIT25.unicloth.dto.admin.order.AdminOrderListResponse;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.ShippingMethod;
import com.EEIT25.unicloth.service.AdminOrderService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/order/orders")
public class AdminOrderController {
    private final AdminOrderService adminOrderService;

    @GetMapping
    public Page<AdminOrderListResponse> getOrders(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) ShippingMethod shippingMethod,
            @ParameterObject
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        AdminOrderFilterRequest filter = new AdminOrderFilterRequest(
                keyword,
                status,
                shippingMethod
        );

        return adminOrderService.getOrders(filter, pageable);
    }
}