package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.order.OrderResponse;
import com.EEIT25.unicloth.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    @GetMapping
    public List<OrderResponse> getOrders(){
        return orderService.getOrders();
    }
}
