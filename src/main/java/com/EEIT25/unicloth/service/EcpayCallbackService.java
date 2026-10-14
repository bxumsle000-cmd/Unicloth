
package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.Payment;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.PaymentStatus;
import com.EEIT25.unicloth.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;

/**
 * 綠界 AIO 付款結果通知處理服務。
 *
 * 驗證通知內容，成功付款後更新付款紀錄及訂單。
 *
 * 目前僅處理付款成功通知。
 * 付款失敗、逾時、退款等流程後續另行實作。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EcpayCallbackService {

    private final EcpayService ecpayService;
    private final PaymentRepository paymentRepository;

    @Value("${ecpay.merchant-id}")
    private String merchantId;

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    /**
     * 接收並處理綠界付款通知。
     *
     * 所有必要驗證完成，並成功提交資料庫交易後，
     * Controller 才能回傳 1|OK。
     */
    @Transactional
    public String handleNotification(
            Map<String, String> params
    ) {

        // 1. 確認通知資料存在
        if (params == null || params.isEmpty()) {
            throw new IllegalArgumentException(
                    "綠界通知資料不可為空"
            );
        }

        // 2. 驗證 CheckMacValue
        if (!ecpayService.verifyCheckMacValue(params)) {
            log.warn("ECPay callback checksum verification failed");

            throw new IllegalArgumentException(
                    "綠界付款通知檢查碼錯誤"
            );
        }

        // 3. 驗證特店編號
        String receivedMerchantId = params.get("MerchantID");

        if (!merchantId.equals(receivedMerchantId)) {
            throw new IllegalArgumentException(
                    "綠界特店編號不正確"
            );
        }

        // 4. 取得商店交易編號
        String merchantTradeNo =
                requireValue(params, "MerchantTradeNo");

        // 5. 驗證交易金額格式
        int tradeAmount;

        try {
            tradeAmount = Integer.parseInt(
                    requireValue(params, "TradeAmt")
            );
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(
                    "綠界交易金額格式錯誤",
                    ex
            );
        }

        // 6. 取得付款結果
        String rtnCode = requireValue(params, "RtnCode");

        // 7. 鎖定付款紀錄，避免同一筆通知並發處理
        Payment payment = paymentRepository
                .findByMerchantTradeNoForUpdate(merchantTradeNo)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "找不到對應的付款紀錄"
                        )
                );

        Order order = payment.getOrder();

        // 8. 核對付款紀錄與訂單金額
        if (payment.getAmount() == null
                || payment.getAmount() != tradeAmount
                || order.getTotal() == null
                || order.getTotal() != tradeAmount) {

            throw new IllegalArgumentException(
                    "綠界付款金額與訂單金額不一致"
            );
        }

        // 9. 確認付款方式
        String receivedPaymentType =
                requireValue(params, "PaymentType");

        if (!isExpectedPaymentType(
                payment.getPaymentMethod(),
                receivedPaymentType)) {

            throw new IllegalArgumentException(
                    "綠界付款方式不一致"
            );
        }

        // 10. 廠商後台模擬通知不可視為實際付款
        if ("1".equals(params.get("SimulatePaid"))) {
            log.warn(
                    "ECPay simulated notification received: {}",
                    merchantTradeNo
            );

            // 驗證過的測試通知可確認收到，
            // 但絕對不更新訂單為已付款。
            return "1|OK";
        }

        // 11. 非付款成功通知，不標記為 PAID
        if (!"1".equals(rtnCode)) {

            log.warn(
                    "ECPay non-success result, tradeNo={}, code={}",
                    merchantTradeNo,
                    rtnCode
            );

            // 暫時保留待付款狀態，供後續對帳。
            return "1|OK";
        }

        // 12. 檢查綠界交易編號
        String ecpayTradeNo =
                requireValue(params, "TradeNo");

        if (ecpayTradeNo.length() > 30) {
            throw new IllegalArgumentException(
                    "綠界交易編號長度不正確"
            );
        }

        // 13. 檢查付款時間
        LocalDateTime paidAt;

        try {
            paidAt = LocalDateTime.parse(
                    requireValue(params, "PaymentDate"),
                    DATE_FORMAT
            );
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(
                    "綠界付款時間格式錯誤",
                    ex
            );
        }

        // 14. 重複通知：同一筆已完成交易不再更新
        if (payment.getStatus() == PaymentStatus.PAID) {

            if (!ecpayTradeNo.equals(
                    payment.getEcpayTradeNo())) {

                throw new IllegalStateException(
                        "已付款交易的綠界交易編號不一致"
                );
            }

            return "1|OK";
        }

        // 15. 取消或失敗的交易不可重新標記為成功
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException(
                    "此付款紀錄目前不可更新為已付款"
            );
        }

        // 16. 已取消的訂單不應自動恢復付款完成
        if (order.getStatus() == OrderStatus.CANCELLED) {

            log.error(
                    "Payment received for cancelled order: {}",
                    order.getOrderNo()
            );

            throw new IllegalStateException(
                    "訂單已取消，需要人工確認付款"
            );
        }

        // 17. 避免其他交易已完成同一張訂單付款
        if (order.getPaidAt() != null) {
            throw new IllegalStateException(
                    "此訂單已有付款紀錄，需要人工對帳"
            );
        }

        // 18. 更新付款紀錄
        payment.setStatus(PaymentStatus.PAID);
        payment.setEcpayTradeNo(ecpayTradeNo);
        payment.setPaidAt(paidAt);

        // 19. 更新訂單付款時間
        order.setPaidAt(paidAt);

        // 20. JPA 會在交易提交時儲存變更
        log.info(
                "ECPay payment verified: orderNo={}, merchantTradeNo={}",
                order.getOrderNo(),
                merchantTradeNo
        );

        return "1|OK";
    }

    /**
     * 取得必要的通知欄位。
     */
    private String requireValue(
            Map<String, String> params,
            String field
    ) {

        String value = params.get(field);

        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    "綠界通知缺少必要欄位：" + field
            );
        }

        return value;
    }

    /**
     * 確認綠界回傳的付款方式與訂單一致。
     */
    private boolean isExpectedPaymentType(
            PaymentMethod method,
            String receivedType
    ) {

        if (method == PaymentMethod.CREDIT) {
            return receivedType.equalsIgnoreCase("Credit")
                    || receivedType.regionMatches(
                            true, 0, "Credit_", 0, 7
                    );
        }

        if (method == PaymentMethod.ATM) {
            return receivedType.equalsIgnoreCase("ATM")
                    || receivedType.regionMatches(
                            true, 0, "ATM_", 0, 4
                    );
        }

        return false;
    }
}
