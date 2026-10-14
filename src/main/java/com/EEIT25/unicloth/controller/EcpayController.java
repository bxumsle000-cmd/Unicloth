
package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.service.EcpayService;
import com.EEIT25.unicloth.service.EcpayCallbackService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Unicloth 綠界金流 API
 *
 * 功能：
 * 1. 建立綠界付款請求
 * 2. 接收綠界付款結果通知
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments/ecpay")
public class EcpayController {

    private final EcpayService ecpayService;

    private final EcpayCallbackService ecpayCallbackService;

    /**
     * 建立綠界付款資料。
     *
     * POST /api/payments/ecpay/create
     *
     * Request:
     * {
     *   "orderNo": "UC20261014-1234"
     * }
     *
     * 需要會員 JWT。
     */
    @PostMapping("/create")
    public Map<String, Object> createPayment(
            @RequestBody CreatePaymentRequest request
    ) {

        // 檢查訂單編號
        if (request == null
                || request.orderNo() == null
                || request.orderNo().isBlank()) {

            throw new IllegalArgumentException(
                    "訂單編號不可為空"
            );
        }

        // 建立付款紀錄並產生綠界付款參數
        Map<String, String> paymentParams =
                ecpayService.createPayment(request.orderNo());

        // 回傳付款網址與 POST 表單參數
        return Map.of(
                "paymentUrl", ecpayService.getApiUrl(),
                "parameters", paymentParams
        );
    }

    /**
     * 接收綠界付款結果通知。
     *
     * POST /api/payments/ecpay/notify
     *
     * 綠界會以 application/x-www-form-urlencoded
     * 格式送出付款結果。
     *
     * 此 API 不需要會員 JWT，
     * 但必須通過 CheckMacValue 等交易驗證。
     *
     * 成功處理後回傳純文字 1|OK。
     */
    @PostMapping(
            value = "/notify",
            consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE,
            produces = MediaType.TEXT_PLAIN_VALUE
    )
    public ResponseEntity<String> notifyPayment(
            @RequestParam Map<String, String> params
    ) {

        try {

            // 驗證通知並更新付款及訂單狀態
            String result =
                    ecpayCallbackService.handleNotification(params);

            // handleNotification 使用 @Transactional。
            // 正常返回代表資料庫交易已完成提交。
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException ex) {

            // 簽章、交易編號、金額等驗證失敗
            log.warn(
                    "ECPay callback rejected: {}",
                    ex.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("0|ERROR");

        } catch (Exception ex) {

            // 非預期錯誤：不要回傳成功訊息
            log.error(
                    "ECPay callback processing failed",
                    ex
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("0|ERROR");
        }
    }

    /**
     * 建立付款請求 DTO。
     */
    public record CreatePaymentRequest(
            String orderNo
    ) {
    }
}
