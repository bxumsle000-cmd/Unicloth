package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.service.EcpayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ecpay")
@RequiredArgsConstructor
public class EcpayController {
    private final EcpayService ecpayService;

    public record CreatePaymentRequest(String orderNo) {}

    /** 已登入會員建立自己的訂單付款表單。 */
    @PostMapping("/create-payment")
    public EcpayService.PaymentForm createPayment(@RequestBody CreatePaymentRequest request) {
        return ecpayService.createPayment(request.orderNo());
    }

    /** 綠界伺服器通知；此端點必須允許未登入請求，並以 CheckMacValue 驗證。 */
    @PostMapping(value = "/callback", produces = MediaType.TEXT_PLAIN_VALUE)
    public String callback(@RequestParam Map<String, String> params) {
        return ecpayService.handleCallback(new LinkedHashMap<>(params));
    }

    @GetMapping("/status/{orderNo}")
    public EcpayService.PaymentState status(@PathVariable String orderNo) {
        return ecpayService.getPaymentState(orderNo);
    }
}
