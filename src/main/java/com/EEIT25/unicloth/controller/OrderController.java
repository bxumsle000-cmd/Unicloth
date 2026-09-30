package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.order.CheckoutRequest;
import com.EEIT25.unicloth.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    /** 結帳：把目前購物車的內容建成一張訂單；成功後前端直接跳到訂單紀錄頁 */
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void checkout(@Valid @RequestBody CheckoutRequest request){
        orderService.checkout(request);
    }
}
