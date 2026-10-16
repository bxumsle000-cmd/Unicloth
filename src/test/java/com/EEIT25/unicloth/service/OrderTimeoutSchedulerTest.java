package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.checkout.CheckoutRequest;
import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.enums.ShippingMethod;
import com.EEIT25.unicloth.repository.CartItemRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * 逾時未付款排程的行為測試（連真的資料庫）。
 * 每個測試結束都會 rollback，不會留下資料。<br>
 * 直接呼叫 cancelExpiredOrders()，不等排程自己跑。
 */
@SpringBootTest
@Transactional
class OrderTimeoutSchedulerTest {

    @Autowired OrderTimeoutScheduler orderTimeoutScheduler;
    @Autowired CheckoutService checkoutService;
    @Autowired OrderRepository orderRepository;
    @Autowired CartItemRepository cartItemRepository;
    @Autowired ProductVariantRepository productVariantRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired EntityManager em;

    @MockitoBean CurrentMember currentMember;

    Member member;
    ProductVariant variant;

    @BeforeEach
    void setUp() {
        member = memberRepository.save(Member.builder()
                .email("order-timeout-test@example.com")
                .passwordHash("x")
                .build());
        when(currentMember.getCurrentId()).thenReturn(member.getId());
        when(currentMember.require()).thenReturn(member);

        variant = productVariantRepository.findAll().stream()
                .filter(v -> v.getProduct().getStatus() == ProductStatus.ON_SALE && v.getStock() >= 2)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("資料庫沒有可結帳的商品，無法測試"));
    }

    /** 結帳買 1 件，回傳訂單 id（信用卡 / ATM 建立後是 UNPAID，貨到付款是 PENDING） */
    private Long checkout(PaymentMethod paymentMethod) {
        Long cartItemId = cartItemRepository.save(CartItem.builder()
                .member(member).variant(variant).qty(1).build()).getId();
        String orderNo = checkoutService.checkout(new CheckoutRequest("王小明", "0912345678", "test@example.com",
                ShippingMethod.HOME, "台北市信義區某路 1 號", paymentMethod, null, null, List.of(cartItemId))).orderNo();
        return orderRepository.findByOrderNo(orderNo).orElseThrow().getId();
    }

    /** 把訂單建立時間改到過去（created_at 不能用 JPA 改，直接下 SQL） */
    private void setCreatedAt(Long orderId, LocalDateTime createdAt) {
        em.flush();
        em.createNativeQuery("UPDATE orders SET created_at = ?1 WHERE id = ?2")
                .setParameter(1, createdAt)
                .setParameter(2, orderId)
                .executeUpdate();
        em.clear();
    }

    private OrderStatus statusOf(Long orderId) {
        em.flush();
        em.clear();
        return orderRepository.findById(orderId).orElseThrow().getStatus();
    }

    @Test
    void 信用卡超過30分鐘沒付款_取消並還原庫存() {
        int stockBefore = variant.getStock();
        Long orderId = checkout(PaymentMethod.CREDIT);
        setCreatedAt(orderId, LocalDateTime.now().minusMinutes(31));

        orderTimeoutScheduler.cancelExpiredOrders();

        assertEquals(OrderStatus.CANCELLED, statusOf(orderId));
        assertEquals(stockBefore, productVariantRepository.findById(variant.getId()).orElseThrow().getStock());
    }

    @Test
    void 信用卡還沒超過30分鐘_不取消() {
        Long orderId = checkout(PaymentMethod.CREDIT);
        setCreatedAt(orderId, LocalDateTime.now().minusMinutes(10));

        orderTimeoutScheduler.cancelExpiredOrders();

        assertEquals(OrderStatus.UNPAID, statusOf(orderId));
    }

    @Test
    void ATM超過30分鐘但還在繳費期限內_不取消() {
        Long orderId = checkout(PaymentMethod.ATM);
        setCreatedAt(orderId, LocalDateTime.now().minusHours(2));

        orderTimeoutScheduler.cancelExpiredOrders();

        assertEquals(OrderStatus.UNPAID, statusOf(orderId));
    }

    @Test
    void ATM超過4天沒付款_取消() {
        Long orderId = checkout(PaymentMethod.ATM);
        setCreatedAt(orderId, LocalDateTime.now().minusDays(4).minusMinutes(1));

        orderTimeoutScheduler.cancelExpiredOrders();

        assertEquals(OrderStatus.CANCELLED, statusOf(orderId));
    }

    @Test
    void 貨到付款_不管多久都不取消() {
        Long orderId = checkout(PaymentMethod.COD);
        setCreatedAt(orderId, LocalDateTime.now().minusDays(30));

        orderTimeoutScheduler.cancelExpiredOrders();

        assertEquals(OrderStatus.PENDING, statusOf(orderId));
    }
}
