
package com.EEIT25.unicloth.service;

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
 * 2. 建立付款紀錄
 * 3. 產生綠界付款參數
 * 4. 計算及驗證 CheckMacValue
 *
 * 注意：
 * 付款成功通知及更新訂單狀態，
 * 將由後續的通知處理服務實作。
 */
@Service
@RequiredArgsConstructor
public class EcpayService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CurrentMember currentMember;

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

    @Value("${ecpay.return-url}")
    private String returnUrl;

    /**
     * 取得綠界測試付款 API 網址。
     */
    public String getApiUrl() {
        return apiUrl;
    }

    /**
     * 建立綠界付款請求。
     *
     * 此方法僅建立付款紀錄和付款參數，
     * 不代表已經付款成功。
     */
    @Transactional
    public Map<String, String> createPayment(
            String orderNo
    ) {

        // 1. 取得目前登入會員
        Member member = currentMember.require();

        // 2. 查詢訂單
        Order order = orderRepository.findByOrderNo(orderNo)
                .orElseThrow(() ->
                        ApiException.notFound("找不到此訂單")
                );

        // 3. 驗證訂單是否屬於目前會員
        if (!order.getMember().getId().equals(member.getId())) {
            throw ApiException.notFound("找不到此訂單");
        }

        // 4. 確認訂單尚未付款
        if (order.getPaidAt() != null) {
            throw ApiException.conflict("此訂單已經付款完成");
        }

        // 5. 確認訂單仍可付款
        if (order.getStatus() != OrderStatus.PENDING) {
            throw ApiException.conflict("目前訂單狀態無法付款");
        }

        // 6. 只允許信用卡及 ATM 使用綠界
        PaymentMethod paymentMethod = order.getPaymentMethod();

        if (paymentMethod != PaymentMethod.CREDIT
                && paymentMethod != PaymentMethod.ATM) {
            throw ApiException.badRequest(
                    "此付款方式不支援綠界金流"
            );
        }

        // 7. 取得資料庫中的真正訂單金額
        Integer amount = order.getTotal();

        if (amount == null || amount <= 0) {
            throw ApiException.badRequest("訂單付款金額不正確");
        }

        // 8. 暫時避免同張訂單重複發起待付款交易
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

        // 9. 產生綠界唯一交易編號
        String merchantTradeNo = generateMerchantTradeNo();

        // 10. 建立付款紀錄
        Payment payment = Payment.builder()
                .order(order)
                .merchantTradeNo(merchantTradeNo)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status(PaymentStatus.PENDING)
                .build();

        paymentRepository.save(payment);

        // 11. 建立綠界付款參數
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

        params.put("ReturnURL", returnUrl);

        // 根據原本的付款方式選擇綠界付款方式
        params.put(
                "ChoosePayment",
                paymentMethod == PaymentMethod.CREDIT
                        ? "Credit"
                        : "ATM"
        );

        // 指定 SHA256 檢查碼
        params.put("EncryptType", "1");

        // 12. 計算 CheckMacValue
        params.put(
                "CheckMacValue",
                generateCheckMacValue(params)
        );

        // 13. 回傳表單資料
        return params;
    }

    /**
     * 產生 20 字元的交易編號。
     *
     * UC + UUID 前 18 碼
     *
     * 實際唯一性由資料庫 UNIQUE 約束保護。
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
     * 計算綠界 AIO CheckMacValue。
     *
     * 1. 排除 CheckMacValue
     * 2. 依照參數名稱排序
     * 3. 前後加入 HashKey、HashIV
     * 4. URL Encode
     * 5. 轉為小寫
     * 6. SHA256
     * 7. 轉為大寫
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

        // URL Encode
        String encoded = URLEncoder.encode(
                query.toString(),
                StandardCharsets.UTF_8
        );

        // 符合綠界 AIO 的 URL Encode 轉換規則
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
     * 驗證綠界回傳資料的 CheckMacValue。
     *
     * 實際通知處理時還必須核對：
     * MerchantID、MerchantTradeNo、TradeAmt、
     * RtnCode，以及付款紀錄狀態。
     */
    public boolean verifyCheckMacValue(
            Map<String, String> params
    ) {

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
