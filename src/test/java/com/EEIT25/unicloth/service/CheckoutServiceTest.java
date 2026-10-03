package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.checkout.CheckoutRequest;
import com.EEIT25.unicloth.dto.checkout.CheckoutResponse;
import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.CouponType;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.enums.ShippingMethod;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CartItemRepository;
import com.EEIT25.unicloth.repository.CouponRepository;
import com.EEIT25.unicloth.repository.MemberCouponRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * 結帳的行為測試（連真的資料庫）。
 * 每個測試結束都會 rollback，不會留下資料。<br>
 * 做法同 WishlistServiceTest：自己建臨時會員，再把 CurrentMember 換成假的。
 */
@SpringBootTest
@Transactional
class CheckoutServiceTest {

    @Autowired CheckoutService checkoutService;
    @Autowired OrderRepository orderRepository;
    @Autowired OrderItemRepository orderItemRepository;
    @Autowired CartItemRepository cartItemRepository;
    @Autowired ProductVariantRepository productVariantRepository;
    @Autowired CouponRepository couponRepository;
    @Autowired MemberCouponRepository memberCouponRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired EntityManager em;

    @MockitoBean CurrentMember currentMember;

    Member member;
    ProductVariant variant;

    @BeforeEach
    void setUp() {
        member = memberRepository.save(Member.builder()
                .email("order-test@example.com")
                .passwordHash("x")
                .name("測試會員")
                .phone("0900000000")
                .gender("male")
                .birthday(LocalDate.of(2000, 1, 1))
                .build());
        when(currentMember.getCurrentId()).thenReturn(member.getId());
        when(currentMember.require()).thenReturn(member);

        // 隨便挑一個上架中、庫存至少 2 的 SKU
        variant = productVariantRepository.findAll().stream()
                .filter(v -> v.getProduct().getStatus() == ProductStatus.ON_SALE && v.getStock() >= 2)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("資料庫沒有可結帳的商品，無法測試"));
    }

    /** 加進測試會員的購物車，回傳購物車項目的 id（結帳勾選要用） */
    private Long addToCart(ProductVariant v, int qty) {
        return cartItemRepository.save(CartItem.builder().member(member).variant(v).qty(qty).build()).getId();
    }

    private CheckoutRequest request(List<Long> cartItemIdList, Long memberCouponId) {
        return new CheckoutRequest("王小明", "0912345678", "test@example.com", ShippingMethod.HOME, "台北市信義區某路 1 號",
                PaymentMethod.COD, null, memberCouponId, cartItemIdList);
    }

    /** 建一張屬於測試會員的折價券 */
    private MemberCoupon giveCoupon(CouponType type, int value, int minSubtotal) {
        Coupon coupon = couponRepository.save(Coupon.builder()
                .code("ORDER-TEST-" + type)
                .title("測試券")
                .type(type)
                .value(value)
                .minSubtotal(minSubtotal)
                .validDays(7)
                .signupGift(false)
                .build());
        return memberCouponRepository.save(MemberCoupon.builder()
                .member(member)
                .coupon(coupon)
                .expireAt(LocalDateTime.now().plusDays(7))
                .build());
    }

    /** 把還在記憶體的變更寫進資料庫並清掉快取，之後重查才會拿到資料庫真正的值 */
    private void flushAndClear() {
        em.flush();
        em.clear();
    }

    /** 測試會員最新的一張訂單（從資料庫查，確認真的有存進去） */
    private Order latestOrder() {
        List<Order> orderList = orderRepository.findByMemberIdOrderByCreatedAtDesc(member.getId());
        assertEquals(1, orderList.size());
        return orderList.get(0);
    }

    @Test
    void 正常結帳_建立訂單_扣庫存_移除已結帳的購物車項目() {
        int stockBefore = variant.getStock();
        int price = variant.getProduct().getPrice();
        Long cartItemId = addToCart(variant, 2);

        CheckoutResponse response = checkoutService.checkout(request(List.of(cartItemId), null));
        flushAndClear();

        Order order = latestOrder();

        // 回傳的摘要要跟存進資料庫的訂單一致
        assertEquals(order.getOrderNo(), response.orderNo());
        assertNotNull(response.createdAt());
        assertEquals("王小明", response.receiverName());
        assertEquals("0912345678", response.receiverPhone());
        assertEquals("HOME", response.shippingMethod());
        assertEquals("COD", response.paymentMethod());
        assertEquals("台北市信義區某路 1 號", response.shippingAddress());
        assertEquals(order.getTotal(), response.total());

        int subtotal = price * 2;
        int shippingFee = subtotal >= 2500 ? 0 : 50;
        assertEquals(subtotal, order.getSubtotal());
        assertEquals(0, order.getDiscount());
        assertEquals(shippingFee, order.getShippingFee());
        assertEquals(subtotal + shippingFee, order.getTotal());
        assertTrue(order.getOrderNo().matches("UC\\d{8}-\\d{4}"), "訂單編號格式：" + order.getOrderNo());
        assertEquals(OrderStatus.PENDING, order.getStatus());

        List<OrderItem> orderItemList = orderItemRepository.findByOrderId(order.getId());
        assertEquals(1, orderItemList.size());
        assertEquals(2, orderItemList.get(0).getQty());
        assertEquals(price * 2, orderItemList.get(0).getTotalPrice());

        assertEquals(stockBefore - 2, productVariantRepository.findById(variant.getId()).orElseThrow().getStock());
        assertTrue(cartItemRepository.findCartWithProducts(member.getId()).isEmpty());
    }

    @Test
    void 小計未滿2500_運費50() {
        // 找一個單價低於 2500 的 SKU，買 1 件
        ProductVariant cheap = productVariantRepository.findAll().stream()
                .filter(v -> v.getProduct().getStatus() == ProductStatus.ON_SALE && v.getStock() >= 1
                        && v.getProduct().getPrice() < 2500)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("找不到單價低於 2500 的商品，無法測試"));
        Long cartItemId = addToCart(cheap, 1);

        checkoutService.checkout(request(List.of(cartItemId), null));
        flushAndClear();

        Order order = latestOrder();
        assertEquals(50, order.getShippingFee());
        assertEquals(order.getSubtotal() + 50, order.getTotal());
    }

    @Test
    void 小計滿2500_免運() {
        // 找一個「庫存 × 單價」能湊到 2500 的 SKU，買剛好湊滿 2500 的數量
        ProductVariant v = productVariantRepository.findAll().stream()
                .filter(x -> x.getProduct().getStatus() == ProductStatus.ON_SALE
                        && x.getStock() * x.getProduct().getPrice() >= 2500)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("找不到能湊滿 2500 的商品，無法測試"));
        int price = v.getProduct().getPrice();
        int qty = (2500 + price - 1) / price;   // 無條件進位
        Long cartItemId = addToCart(v, qty);

        checkoutService.checkout(request(List.of(cartItemId), null));
        flushAndClear();

        Order order = latestOrder();
        assertTrue(order.getSubtotal() >= 2500);
        assertEquals(0, order.getShippingFee());
        assertEquals(order.getSubtotal(), order.getTotal());
    }

    @Test
    void 沒有勾選任何商品_不能結帳() {
        addToCart(variant, 1);

        ApiException e = assertThrows(ApiException.class, () -> checkoutService.checkout(request(List.of(), null)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void 只結帳勾選的項目_沒勾的留在購物車() {
        ProductVariant other = productVariantRepository.findAll().stream()
                .filter(v -> v.getProduct().getStatus() == ProductStatus.ON_SALE && v.getStock() >= 1
                        && !v.getId().equals(variant.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("找不到第二個可結帳的 SKU，無法測試"));
        int otherStockBefore = other.getStock();
        Long boughtId = addToCart(variant, 1);
        Long keptId = addToCart(other, 1);

        checkoutService.checkout(request(List.of(boughtId), null));
        flushAndClear();

        // 訂單只有勾選的那一筆
        Order order = latestOrder();
        List<OrderItem> orderItemList = orderItemRepository.findByOrderId(order.getId());
        assertEquals(1, orderItemList.size());
        assertEquals(variant.getId(), orderItemList.get(0).getVariant().getId());
        assertEquals(variant.getProduct().getPrice(), order.getSubtotal());

        // 沒勾的還在購物車，庫存也沒被扣
        List<CartItem> remainingCartItemList = cartItemRepository.findCartWithProducts(member.getId());
        assertEquals(1, remainingCartItemList.size());
        assertEquals(keptId, remainingCartItemList.get(0).getId());
        assertEquals(otherStockBefore, productVariantRepository.findById(other.getId()).orElseThrow().getStock());
    }

    @Test
    void 勾選別人的購物車項目_不能結帳() {
        Member someoneElse = memberRepository.save(Member.builder()
                .email("order-test-other@example.com")
                .passwordHash("x")
                .name("別的會員")
                .phone("0900000001")
                .gender("female")
                .birthday(LocalDate.of(2000, 1, 1))
                .build());
        Long othersCartItemId = cartItemRepository.save(CartItem.builder()
                .member(someoneElse).variant(variant).qty(1).build()).getId();
        Long myCartItemId = addToCart(variant, 1);

        ApiException e = assertThrows(ApiException.class,
                () -> checkoutService.checkout(request(List.of(myCartItemId, othersCartItemId), null)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void 庫存不足_不能結帳() {
        Long cartItemId = addToCart(variant, variant.getStock() + 1);

        ApiException e = assertThrows(ApiException.class, () -> checkoutService.checkout(request(List.of(cartItemId), null)));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void 使用折價券_金額有折抵_券標記為已使用() {
        Long cartItemId = addToCart(variant, 2);
        int subtotal = variant.getProduct().getPrice() * 2;
        MemberCoupon mc = giveCoupon(CouponType.AMOUNT, 100, 0);

        checkoutService.checkout(request(List.of(cartItemId), mc.getId()));
        flushAndClear();

        Order order = latestOrder();
        int expectedDiscount = Math.min(100, subtotal);
        assertEquals(expectedDiscount, order.getDiscount());
        assertEquals(subtotal - expectedDiscount + order.getShippingFee(), order.getTotal());

        MemberCoupon used = memberCouponRepository.findById(mc.getId()).orElseThrow();
        assertNotNull(used.getUsedAt());
        assertEquals(order.getId(), used.getOrder().getId());
    }

    @Test
    void 券已使用過_不能再用() {
        Long cartItemId = addToCart(variant, 1);
        MemberCoupon mc = giveCoupon(CouponType.AMOUNT, 100, 0);
        mc.setUsedAt(LocalDateTime.now());

        ApiException e = assertThrows(ApiException.class, () -> checkoutService.checkout(request(List.of(cartItemId), mc.getId())));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void 未達最低消費_不能用券() {
        Long cartItemId = addToCart(variant, 1);
        MemberCoupon mc = giveCoupon(CouponType.AMOUNT, 100, 99_999_999);

        ApiException e = assertThrows(ApiException.class, () -> checkoutService.checkout(request(List.of(cartItemId), mc.getId())));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }
}
