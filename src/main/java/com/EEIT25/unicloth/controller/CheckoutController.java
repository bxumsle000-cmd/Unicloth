package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.checkout.CheckoutRequest;
import com.EEIT25.unicloth.dto.checkout.CheckoutResponse;
import com.EEIT25.unicloth.service.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/checkout")
public class CheckoutController {
    private final CheckoutService checkoutService;

    /** 結帳：把目前購物車的內容建成一張訂單，回傳訂單摘要給「訂單完成」頁顯示 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest request){
        return checkoutService.checkout(request);
    }
}
