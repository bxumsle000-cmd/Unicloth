package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.checkout.CheckoutRequest;
import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.Payment;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.CouponType;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.PaymentStatus;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.enums.ShippingMethod;
import com.EEIT25.unicloth.repository.CartItemRepository;
import com.EEIT25.unicloth.repository.CouponRepository;
import com.EEIT25.unicloth.repository.MemberCouponRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.repository.PaymentRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * 綠界付款失敗通知 → 取消訂單的行為測試（連真的資料庫）。
 * 每個測試結束都會 rollback，不會留下資料。<br>
 * 做法同 CheckoutServiceTest：自己建臨時會員，再把 CurrentMember 換成假的。
 */
@SpringBootTest
@Transactional
class EcpayCallbackCancelTest {

    @Autowired CheckoutService checkoutService;
    @Autowired EcpayService ecpayService;
    @Autowired EcpayCallbackService ecpayCallbackService;
    @Autowired OrderRepository orderRepository;
    @Autowired PaymentRepository paymentRepository;
    @Autowired CartItemRepository cartItemRepository;
    @Autowired ProductVariantRepository productVariantRepository;
    @Autowired CouponRepository couponRepository;
    @Autowired MemberCouponRepository memberCouponRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired EntityManager em;

    @MockitoBean CurrentMember currentMember;

    @Value("${ecpay.merchant-id}")
    String merchantId;

    Member member;
    ProductVariant variant;
    MemberCoupon memberCoupon;

    @BeforeEach
    void setUp() {
        member = memberRepository.save(Member.builder()
                .email("ecpay-cancel-test@example.com")
                .passwordHash("x")
                .build());
        when(currentMember.getCurrentId()).thenReturn(member.getId());
        when(currentMember.require()).thenReturn(member);

        variant = productVariantRepository.findAll().stream()
                .filter(v -> v.getProduct().getStatus() == ProductStatus.ON_SALE && v.getStock() >= 2)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("資料庫沒有可結帳的商品，無法測試"));

        Coupon coupon = couponRepository.save(Coupon.builder()
                .code("ECPAY-CANCEL-TEST")
                .title("測試券")
                .type(CouponType.AMOUNT)
                .value(10)
                .minSubtotal(0)
                .validDays(7)
                .signupGift(false)
                .build());
        memberCoupon = memberCouponRepository.save(MemberCoupon.builder()
                .member(member)
                .coupon(coupon)
                .expireAt(LocalDateTime.now().plusDays(7))
                .build());
    }

    /** 結帳（用券、買 2 件）並建立綠界付款，回傳付款紀錄 */
    private Payment checkoutAndCreatePayment(PaymentMethod paymentMethod) {
        Long cartItemId = cartItemRepository.save(CartItem.builder()
                .member(member).variant(variant).qty(2).build()).getId();

        String orderNo = checkoutService.checkout(new CheckoutRequest("王小明", "0912345678", "test@example.com",
                ShippingMethod.HOME, "台北市信義區某路 1 號", paymentMethod, null,
                memberCoupon.getId(), List.of(cartItemId))).orderNo();

        String merchantTradeNo = ecpayService.createPayment(orderNo).get("MerchantTradeNo");
        flushAndClear();
        return paymentRepository.findByMerchantTradeNo(merchantTradeNo).orElseThrow();
    }

    /** 模擬綠界送來的付款失敗通知（含正確的 CheckMacValue） */
    private Map<String, String> failedNotification(Payment payment, String paymentType, String rtnCode) {
        Map<String, String> params = new HashMap<>();
        params.put("MerchantID", merchantId);
        params.put("MerchantTradeNo", payment.getMerchantTradeNo());
        params.put("TradeAmt", String.valueOf(payment.getAmount()));
        params.put("RtnCode", rtnCode);
        params.put("RtnMsg", "Failed");
        params.put("PaymentType", paymentType);
        params.put("CheckMacValue", ecpayService.generateCheckMacValue(params));
        return params;
    }

    private void flushAndClear() {
        em.flush();
        em.clear();
    }

    @Test
    void 信用卡付款失敗_訂單取消_庫存和折價券還原() {
        int stockBefore = variant.getStock();
        Payment payment = checkoutAndCreatePayment(PaymentMethod.CREDIT);

        // 結帳後：庫存扣 2、券已使用
        assertEquals(stockBefore - 2, productVariantRepository.findById(variant.getId()).orElseThrow().getStock());
        assertNotNull(memberCouponRepository.findById(memberCoupon.getId()).orElseThrow().getUsedAt());

        String result = ecpayCallbackService.handleNotification(
                failedNotification(payment, "Credit_CreditCard", "10100058"));
        flushAndClear();

        assertEquals("1|OK", result);

        Order order = orderRepository.findById(payment.getOrder().getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(PaymentStatus.CANCELLED, paymentRepository.findById(payment.getId()).orElseThrow().getStatus());
        assertEquals(stockBefore, productVariantRepository.findById(variant.getId()).orElseThrow().getStock());

        MemberCoupon couponAfter = memberCouponRepository.findById(memberCoupon.getId()).orElseThrow();
        assertNull(couponAfter.getUsedAt());
        assertNull(couponAfter.getOrder());
    }

    @Test
    void 同一筆失敗通知送兩次_庫存只加回一次() {
        int stockBefore = variant.getStock();
        Payment payment = checkoutAndCreatePayment(PaymentMethod.CREDIT);
        Map<String, String> params = failedNotification(payment, "Credit_CreditCard", "10100058");

        ecpayCallbackService.handleNotification(params);
        flushAndClear();
        ecpayCallbackService.handleNotification(params);
        flushAndClear();

        assertEquals(stockBefore, productVariantRepository.findById(variant.getId()).orElseThrow().getStock());
    }

    @Test
    void 信用卡訂單用電子支付付款成功_寫入paid_at() {
        Payment payment = checkoutAndCreatePayment(PaymentMethod.CREDIT);

        // 跟綠界測試環境「測試付款請點此」實際送來的一樣：DigitalPayment_iPASS MONEY
        Map<String, String> params = new HashMap<>();
        params.put("MerchantID", merchantId);
        params.put("MerchantTradeNo", payment.getMerchantTradeNo());
        params.put("TradeAmt", String.valueOf(payment.getAmount()));
        params.put("RtnCode", "1");
        params.put("RtnMsg", "交易成功");
        params.put("PaymentType", "DigitalPayment_iPASS MONEY");
        params.put("TradeNo", "2610161230275060");
        params.put("PaymentDate", "2026/10/16 12:30:33");
        params.put("SimulatePaid", "0");
        params.put("CheckMacValue", ecpayService.generateCheckMacValue(params));

        String result = ecpayCallbackService.handleNotification(params);
        flushAndClear();

        assertEquals("1|OK", result);
        Payment paid = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.PAID, paid.getStatus());
        assertEquals("2610161230275060", paid.getEcpayTradeNo());
        assertEquals(LocalDateTime.of(2026, 10, 16, 12, 30, 33),
                orderRepository.findById(payment.getOrder().getId()).orElseThrow().getPaidAt());
    }

    @Test
    void ATM付款失敗_跟信用卡一樣取消訂單() {
        int stockBefore = variant.getStock();
        Payment payment = checkoutAndCreatePayment(PaymentMethod.ATM);

        ecpayCallbackService.handleNotification(failedNotification(payment, "ATM_TAISHIN", "10100058"));
        flushAndClear();

        Order order = orderRepository.findById(payment.getOrder().getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(stockBefore, productVariantRepository.findById(variant.getId()).orElseThrow().getStock());
        assertNull(memberCouponRepository.findById(memberCoupon.getId()).orElseThrow().getUsedAt());
    }
}
