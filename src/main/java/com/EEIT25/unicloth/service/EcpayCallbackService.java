
package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.Payment;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.PaymentStatus;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.repository.PaymentRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

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
 * Unicloth 綠界 AIO 付款結果通知服務。
 *
 * 功能：
 * 1. 驗證 CheckMacValue
 * 2. 驗證商店、交易編號及金額
 * 3. 先鎖定訂單，再鎖定付款紀錄
 * 4. 防止重複付款通知
 * 5. 成功付款後更新 Payment 和 Order
 * 6. 信用卡付款失敗時取消訂單（OrderService.cancelOrder）
 *
 * 注意：
 * ATM 逾時未付款和退款需要另外完成。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EcpayCallbackService {

    private final EcpayService ecpayService;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final EntityManager entityManager;

    @Value("${ecpay.merchant-id}")
    private String merchantId;

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    /**
     * 處理綠界付款通知。
     *
     * 只有驗證通過且資料庫交易提交成功後，
     * Controller 才可以回傳 1|OK。
     */
    @Transactional
    public String handleNotification(
            Map<String, String> params
    ) {

        // 1. 檢查通知資料
        if (params == null || params.isEmpty()) {
            throw new IllegalArgumentException(
                    "綠界通知資料不可為空"
            );
        }

        // 收到通知就先記一筆，之後查「通知有沒有進來、內容是什麼」比較容易
        log.info(
                "ECPay notification received: tradeNo={}, RtnCode={}, PaymentType={}, SimulatePaid={}",
                params.get("MerchantTradeNo"),
                params.get("RtnCode"),
                params.get("PaymentType"),
                params.get("SimulatePaid")
        );

        // 2. 驗證 CheckMacValue
        if (!ecpayService.verifyCheckMacValue(params)) {

            log.warn("ECPay CheckMacValue verification failed");

            throw new IllegalArgumentException(
                    "綠界付款通知檢查碼錯誤"
            );
        }

        // 3. 驗證 MerchantID
        String receivedMerchantId =
                requireValue(params, "MerchantID");

        if (!merchantId.equals(receivedMerchantId)) {
            throw new IllegalArgumentException(
                    "綠界特店編號不一致"
            );
        }

        // 4. 取得交易編號
        String merchantTradeNo =
                requireValue(params, "MerchantTradeNo");

        // 5. 驗證金額格式
        int tradeAmount;

        try {
            tradeAmount = Integer.parseInt(
                    requireValue(params, "TradeAmt")
            );
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(
                    "付款金額格式錯誤",
                    ex
            );
        }

        if (tradeAmount <= 0) {
            throw new IllegalArgumentException(
                    "付款金額必須大於零"
            );
        }

        // 6. 取得付款結果及付款方式
        String rtnCode = requireValue(params, "RtnCode");

        String receivedPaymentType =
                requireValue(params, "PaymentType");

        // 7. 先查詢付款紀錄，取得所屬訂單 ID
        // 此時還沒有鎖定付款紀錄
        Payment paymentReference = paymentRepository
                .findByMerchantTradeNo(merchantTradeNo)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "找不到對應的付款紀錄"
                        )
                );

        Long orderId = paymentReference.getOrder().getId();

        // 8. 先鎖定訂單
        // 和 EcpayService 建立付款時使用相同的鎖定順序
        Order order = orderRepository
                .findByIdForUpdate(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "找不到對應的訂單"
                        )
                );

        // 9. 再鎖定付款紀錄
        Payment payment = paymentRepository
                .findByMerchantTradeNoForUpdate(merchantTradeNo)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "找不到對應的付款紀錄"
                        )
                );

        // 10. 強制重新讀取付款紀錄
        // 避免 JPA 第一層快取保留鎖定前的舊狀態
        entityManager.refresh(
                payment,
                LockModeType.PESSIMISTIC_WRITE
        );

        // 11. 再次確認付款紀錄仍屬於同一張訂單
        if (!order.getId().equals(payment.getOrder().getId())) {
            throw new IllegalStateException(
                    "付款紀錄與訂單關聯不一致"
            );
        }

        // 12. 核對資料庫實際付款金額
        if (payment.getAmount() == null
                || payment.getAmount().intValue() != tradeAmount
                || order.getTotal() == null
                || order.getTotal().intValue() != tradeAmount) {

            throw new IllegalArgumentException(
                    "綠界付款金額與訂單金額不一致"
            );
        }

        // 13. 核對付款方式
        if (!isExpectedPaymentType(
                payment.getPaymentMethod(),
                receivedPaymentType)) {

            throw new IllegalArgumentException(
                    "綠界付款方式不一致"
            );
        }

        // 14. 判斷是否為綠界後台的模擬付款通知
        // SimulatePaid=1 只是測試 ReturnURL，
        // 不能當成真正付款成功
        if ("1".equals(params.get("SimulatePaid"))) {

            log.info(
                    "ECPay simulated callback received: {}",
                    merchantTradeNo
            );

            return "1|OK";
        }

        // 15. 非付款成功通知
        if (!"1".equals(rtnCode)) {

            log.warn(
                    "ECPay non-success callback: tradeNo={}, code={}",
                    merchantTradeNo,
                    rtnCode
            );


            // 信用卡付款失敗：訂單還在待付款才取消，並還原庫存與折價券
            // （已付款、已取消或已出貨的訂單不動，避免誤取消）
            if (payment.getStatus() == PaymentStatus.PENDING
                    && order.getStatus() == OrderStatus.UNPAID
                    && order.getPaidAt() == null) {

                orderService.cancelOrder(order.getId());

                log.info(
                        "Order cancelled by ECPay failed payment: orderNo={}, tradeNo={}",
                        order.getOrderNo(),
                        merchantTradeNo
                );
            }

            return "1|OK";
        }

        // 16. 取得綠界交易編號
        String ecpayTradeNo =
                requireValue(params, "TradeNo");

        if (ecpayTradeNo.length() > 30) {
            throw new IllegalArgumentException(
                    "綠界交易編號長度不正確"
            );
        }

        // 17. 解析付款時間
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

        // 18. 如果已經付款成功，檢查是否為重複通知
        if (payment.getStatus() == PaymentStatus.PAID) {

            if (!ecpayTradeNo.equals(payment.getEcpayTradeNo())
                    || order.getPaidAt() == null) {

                throw new IllegalStateException(
                        "已付款交易資料不一致，需要人工對帳"
                );
            }

            log.info(
                    "ECPay duplicate paid callback: {}",
                    merchantTradeNo
            );

            // 同一筆合法付款通知重複送達
            // 不再修改資料庫
            return "1|OK";
        }

        // 19. 只允許 PENDING 更新為 PAID
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException(
                    "此付款紀錄目前不可更新為已付款"
            );
        }

        // 20. 已取消的訂單不能自動改成已付款
        if (order.getStatus() == OrderStatus.CANCELLED) {

            log.error(
                    "Payment received for cancelled order: {}",
                    order.getOrderNo()
            );

            throw new IllegalStateException(
                    "訂單已取消，需要人工確認"
            );
        }

        // 21. 防止同張訂單被不同交易重複付款
        if (order.getPaidAt() != null) {

            log.error(
                    "Duplicate payment for order: {}",
                    order.getOrderNo()
            );

            throw new IllegalStateException(
                    "此訂單已有付款成功紀錄，需要人工對帳"
            );
        }

        // 22. 更新付款紀錄
        payment.setStatus(PaymentStatus.PAID);
        payment.setEcpayTradeNo(ecpayTradeNo);
        payment.setPaidAt(paidAt);

        // 23. 更新訂單付款時間，狀態從「未付款」進入「訂單確認中」
        order.setPaidAt(paidAt);
        order.setStatus(OrderStatus.PENDING);

        // 24. JPA 會在交易提交時儲存修改
        log.info(
                "ECPay payment verified: orderNo={}, tradeNo={}",
                order.getOrderNo(),
                merchantTradeNo
        );

        return "1|OK";
    }

    /**
     * 取得必要欄位。
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
     * 確認付款方式一致。
     */
    private boolean isExpectedPaymentType(
            PaymentMethod method,
            String receivedType
    ) {

        if (method == PaymentMethod.CREDIT) {
            // 綠界的信用卡付款頁同時提供電子支付（iPASS MONEY、全支付、綠界Pay 等），
            // 顧客選了也算正常付款，回傳的是 DigitalPayment_xxx
            // （測試環境的「測試付款請點此」就是模擬 DigitalPayment_iPASS MONEY）
            return receivedType.equalsIgnoreCase("Credit")
                    || receivedType.regionMatches(
                            true, 0, "Credit_", 0, 7
                    )
                    || receivedType.regionMatches(
                            true, 0, "DigitalPayment_", 0, 15
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
