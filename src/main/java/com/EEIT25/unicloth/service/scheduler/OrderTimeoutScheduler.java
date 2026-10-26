package com.EEIT25.unicloth.service.scheduler;

import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.order.PaymentMethod;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.service.shop.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 逾時未付款自動取消的排程。<br>
 * 顧客跳到綠界後直接關掉頁面，綠界不會發任何通知，
 * 訂單會一直停在 UNPAID（未付款）、庫存和折價券也被鎖住，所以定時檢查並取消。<br>
 * 只處理信用卡和 ATM（走綠界的訂單），貨到付款不受影響。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderTimeoutScheduler {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    // 信用卡：跳到綠界後多久沒付款就取消（分鐘）
    @Value("${order.payment-timeout.credit-minutes:30}")
    private long creditTimeoutMinutes;

    // ATM：要比綠界的繳費期限長，不然顧客還沒去轉帳就被取消（分鐘，預設 4 天）
    @Value("${order.payment-timeout.atm-minutes:5760}")
    private long atmTimeoutMinutes;

    /**
     * 每 10 分鐘檢查一次（啟動後等 1 分鐘才第一次執行）。<br>
     * fixedDelay：上一次跑完才開始算 10 分鐘，不會兩次同時跑。
     */
    @Scheduled(initialDelay = 60_000, fixedDelay = 600_000)
    public void cancelExpiredOrders() {
        LocalDateTime now = LocalDateTime.now();

        cancelExpired(PaymentMethod.CREDIT, now.minusMinutes(creditTimeoutMinutes));
        cancelExpired(PaymentMethod.ATM, now.minusMinutes(atmTimeoutMinutes));
    }

    /**
     * 找出某種付款方式、在 createdBefore 之前建立、還沒付款的訂單，一張一張取消。<br>
     * 取消的細節（還原庫存、折價券）在 {@link OrderService#cancelOrder(Long)}。
     */
    private void cancelExpired(PaymentMethod paymentMethod, LocalDateTime createdBefore) {
        List<Order> expiredOrderList = orderRepository
                .findByStatusAndPaidAtIsNullAndPaymentMethodAndCreatedAtBefore(
                        OrderStatus.UNPAID, paymentMethod, createdBefore);

        for (Order order : expiredOrderList) {
            // 每張訂單各自一個交易：一張失敗（例如剛好在這時候付款成功）不影響其他張
            try {
                orderService.cancelOrder(order.getId());
                log.info("Order cancelled by payment timeout: orderNo={}, method={}",
                        order.getOrderNo(), paymentMethod);
            } catch (Exception e) {
                log.warn("Payment timeout cancel failed: orderNo={}, reason={}",
                        order.getOrderNo(), e.getMessage());
            }
        }
    }
}
