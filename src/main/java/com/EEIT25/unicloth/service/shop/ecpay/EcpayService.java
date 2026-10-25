
package com.EEIT25.unicloth.service.shop.ecpay;

import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.Payment;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.PaymentStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.repository.PaymentRepository;
import com.EEIT25.unicloth.security.CurrentMember;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

/**
 * Unicloth 綠界測試金流服務。
 *
 * 功能：
 * 1. 驗證訂單及會員身分
 * 2. 鎖定訂單，避免並發建立付款
 * 3. 建立付款紀錄
 * 4. 產生綠界付款參數
 * 5. 計算及驗證 CheckMacValue
 * 6. 設定付款後返回 KINU 網站
 */
@Service
@RequiredArgsConstructor
public class EcpayService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CurrentMember currentMember;
    private final EcpayReturnUrlResolver ecpayReturnUrlResolver;

    private static final ZoneId TAIWAN_ZONE =
            ZoneId.of("Asia/Taipei");

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    @Value("${ecpay.merchant-id}")
    private String merchantId;

    @Value("${ecpay.hash-key}")
    private String hashKey;

    @Value("${ecpay.hash-iv}")
    private String hashIv;

    @Value("${ecpay.api-url}")
    private String apiUrl;

    // 新增：綠界付款後返回 KINU 的網址
    @Value("${ecpay.client-back-url}")
    private String clientBackUrl;

    /**
     * 取得綠界測試付款 API 網址。
     */
    public String getApiUrl() {
        return apiUrl;
    }

    /**
     * 建立綠界付款請求。
     *
     * 使用資料庫交易鎖，防止同一張訂單
     * 同時建立多筆 PENDING 付款紀錄。
     */
    @Transactional
    public Map<String, String> createPayment(String orderNo) {

        // 1. 取得登入會員
        Member member = currentMember.require();

        // 2. 檢查訂單編號
        if (orderNo == null || orderNo.isBlank()) {
            throw ApiException.badRequest("訂單編號不可為空");
        }

        // 3. 鎖定訂單
        Order order = orderRepository
                .findByOrderNoForUpdate(orderNo)
                .orElseThrow(() ->
                        ApiException.notFound("找不到此訂單")
                );

        // 4. 確認訂單屬於目前會員
        if (!order.getMember().getId().equals(member.getId())) {
            throw ApiException.notFound("找不到此訂單");
        }

        // 5. 確認尚未付款
        if (order.getPaidAt() != null) {
            throw ApiException.conflict("此訂單已經付款完成");
        }

        // 6. 確認訂單狀態：只有「未付款」的訂單可以付款
        if (order.getStatus() != OrderStatus.UNPAID) {
            throw ApiException.conflict("目前訂單狀態無法付款");
        }

        // 7. 確認付款方式
        PaymentMethod paymentMethod = order.getPaymentMethod();

        if (paymentMethod != PaymentMethod.CREDIT
                && paymentMethod != PaymentMethod.ATM) {

            throw ApiException.badRequest(
                    "此付款方式不支援綠界金流"
            );
        }

        // 8. 取得訂單實際金額
        Integer amount = order.getTotal();

        if (amount == null || amount <= 0) {
            throw ApiException.badRequest("訂單付款金額不正確");
        }

        // 9. 檢查是否有尚未完成的付款紀錄
        List<Payment> pendingPayments =
                paymentRepository.findByOrderIdAndStatus(
                        order.getId(),
                        PaymentStatus.PENDING
                );

        if (!pendingPayments.isEmpty()) {
            throw ApiException.conflict(
                    "此訂單已有待付款交易，請勿重複建立"
            );
        }

        // 10. 檢查是否已經有付款成功紀錄
        List<Payment> paidPayments =
                paymentRepository.findByOrderIdAndStatus(
                        order.getId(),
                        PaymentStatus.PAID
                );

        if (!paidPayments.isEmpty()) {
            throw ApiException.conflict(
                    "此訂單已有付款成功紀錄"
            );
        }

        // 11. 產生綠界交易編號
        String merchantTradeNo = generateMerchantTradeNo();

        // 12. 建立付款紀錄
        Payment payment = Payment.builder()
                .order(order)
                .merchantTradeNo(merchantTradeNo)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status(PaymentStatus.PENDING)
                .build();

        paymentRepository.save(payment);

        // 13. 建立綠界付款參數
        Map<String, String> params = new LinkedHashMap<>();

        params.put("MerchantID", merchantId);

        params.put("MerchantTradeNo", merchantTradeNo);

        params.put(
                "MerchantTradeDate",
                LocalDateTime.now(TAIWAN_ZONE).format(DATE_FORMAT)
        );

        params.put("PaymentType", "aio");

        params.put("TotalAmount", String.valueOf(amount));

        params.put("TradeDesc", "Unicloth Order Payment");

        params.put("ItemName", "Unicloth Clothing Order");

        // 綠界伺服器通知 Spring Boot
        // 網址會自動用 docker-compose 的 tunnel 目前的網址（見 EcpayReturnUrlResolver）
        params.put("ReturnURL", ecpayReturnUrlResolver.resolve());

        // 新增：綠界顯示「返回商店」按鈕
        params.put("ClientBackURL", clientBackUrl);

        // 指定付款方式
        params.put(
                "ChoosePayment",
                paymentMethod == PaymentMethod.CREDIT
                        ? "Credit"
                        : "ATM"
        );

        // SHA256
        params.put("EncryptType", "1");

        // 14. 計算檢查碼
        // ClientBackURL 也會參與 CheckMacValue 計算
        params.put(
                "CheckMacValue",
                generateCheckMacValue(params)
        );

        // 15. 回傳付款參數
        return params;
    }

    /**
     * 產生 20 字元的商店交易編號。
     */
    private String generateMerchantTradeNo() {

        String tradeNo;

        do {
            tradeNo = "UC"
                    + UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 18)
                            .toUpperCase(Locale.ROOT);

        } while (
                paymentRepository.existsByMerchantTradeNo(tradeNo)
        );

        return tradeNo;
    }

    /**
     * 產生綠界 SHA256 CheckMacValue。
     *
     * 1. 排除 CheckMacValue
     * 2. 依參數名稱排序
     * 3. 加入 HashKey 和 HashIV
     * 4. URL Encode
     * 5. 特殊字元轉換
     * 6. SHA256
     */
    public String generateCheckMacValue(
            Map<String, String> params
    ) {

        Map<String, String> sortedParams =
                new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

        for (Map.Entry<String, String> entry : params.entrySet()) {

            if (!entry.getKey().equalsIgnoreCase("CheckMacValue")) {
                sortedParams.put(entry.getKey(), entry.getValue());
            }
        }

        StringBuilder query = new StringBuilder();

        query.append("HashKey=").append(hashKey);

        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {

            query.append("&")
                    .append(entry.getKey())
                    .append("=")
                    .append(entry.getValue());
        }

        query.append("&HashIV=").append(hashIv);

        String encoded = URLEncoder.encode(
                query.toString(),
                StandardCharsets.UTF_8
        );

        // 綠界 AIO URL Encode 轉換規則
        encoded = encoded
                .replace("%2D", "-")
                .replace("%5F", "_")
                .replace("%2E", ".")
                .replace("%21", "!")
                .replace("%2A", "*")
                .replace("%28", "(")
                .replace("%29", ")");

        encoded = encoded.toLowerCase(Locale.ROOT);

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    encoded.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder result = new StringBuilder();

            for (byte b : hash) {
                result.append(
                        String.format("%02X", b & 0xFF)
                );
            }

            return result.toString();

        } catch (NoSuchAlgorithmException e) {

            throw new IllegalStateException(
                    "SHA-256 加密功能無法使用",
                    e
            );
        }
    }

    /**
     * 驗證綠界回傳的 CheckMacValue。
     */
    public boolean verifyCheckMacValue(
            Map<String, String> params
    ) {

        if (params == null) {
            return false;
        }

        String receivedMac = params.get("CheckMacValue");

        if (receivedMac == null || receivedMac.isBlank()) {
            return false;
        }

        String calculatedMac = generateCheckMacValue(params);

        return MessageDigest.isEqual(
                receivedMac.toUpperCase(Locale.ROOT)
                        .getBytes(StandardCharsets.US_ASCII),
                calculatedMac.getBytes(StandardCharsets.US_ASCII)
        );
    }
}
