package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.checkout.CheckoutRequest;
import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.CouponType;
import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.ShippingMethod;
import com.EEIT25.unicloth.repository.CartItemRepository;
import com.EEIT25.unicloth.repository.CouponRepository;
import com.EEIT25.unicloth.repository.MemberCouponRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

/**
 * 同一張折價券，兩個結帳請求「同時」送進來，應該只有一個能用到券。<br>
 * 跟 CheckoutServiceTest 不同：這裡<b>不能</b>加 @Transactional，
 * 兩個執行緒要各自開交易、各自 commit 才模擬得出同時結帳，
 * 所以資料會真的寫進資料庫，測完由 {@link #cleanUp()} 自己刪掉。
 */
@SpringBootTest
class CheckoutCouponConcurrencyTest {

    @Autowired CheckoutService checkoutService;
    @Autowired CartItemRepository cartItemRepository;
    @Autowired ProductVariantRepository productVariantRepository;
    @Autowired CouponRepository couponRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired EntityManager em;

    @MockitoBean CurrentMember currentMember;
    // 包一層 spy：查券時換成自己查（Repository 是介面，Mockito 沒辦法 callRealMethod），查完先停在柵欄等另一個執行緒
    @MockitoSpyBean MemberCouponRepository memberCouponRepository;

    Member member;
    Coupon coupon;
    MemberCoupon memberCoupon;
    List<Map<String, Object>> variantStockList;   // 測完要把庫存改回來

    @BeforeEach
    void setUp() {
        member = memberRepository.save(Member.builder()
                .email("coupon-race-" + System.nanoTime() + "@example.com")
                .passwordHash("x")
                .name("測試會員")
                .phone("0900000000")
                .gender("male")
                .birthday(LocalDate.of(2000, 1, 1))
                .build());
        when(currentMember.require()).thenReturn(member);
        when(currentMember.getCurrentId()).thenReturn(member.getId());

        coupon = couponRepository.save(Coupon.builder()
                .code("RACE" + System.nanoTime() % 1_000_000_000)
                .title("同時結帳測試券")
                .type(CouponType.AMOUNT)
                .value(100)
                .minSubtotal(0)
                .validDays(7)
                .signupGift(false)
                .build());
        memberCoupon = memberCouponRepository.save(MemberCoupon.builder()
                .member(member)
                .coupon(coupon)
                .expireAt(LocalDateTime.now().plusDays(7))
                .build());

        // 兩個不同的 SKU（同一個會員的購物車不能放兩筆同 SKU），各自當一個請求要結帳的商品
        variantStockList = jdbcTemplate.queryForList("""
                SELECT TOP 2 v.id, v.stock FROM product_variants v
                JOIN products p ON p.id = v.product_id
                WHERE p.status = 'ON_SALE' AND v.stock >= 1
                ORDER BY v.id""");
        assertEquals(2, variantStockList.size(), "資料庫找不到兩個可結帳的 SKU，無法測試");
    }

    @AfterEach
    void cleanUp() {
        // orders 和 member_coupons 互相參照，先把券上的 order_id 清掉才刪得了訂單
        jdbcTemplate.update("UPDATE member_coupons SET order_id = NULL WHERE member_id = ?", member.getId());
        jdbcTemplate.update("DELETE FROM orders WHERE member_id = ?", member.getId());          // order_items 會跟著刪
        jdbcTemplate.update("DELETE FROM member_coupons WHERE member_id = ?", member.getId());
        jdbcTemplate.update("DELETE FROM coupons WHERE id = ?", coupon.getId());
        jdbcTemplate.update("DELETE FROM members WHERE id = ?", member.getId());                // cart_items 會跟著刪
        for (Map<String, Object> row : variantStockList) {
            jdbcTemplate.update("UPDATE product_variants SET stock = ? WHERE id = ?", row.get("stock"), row.get("id"));
        }
    }

    private Long addToCart(Long variantId) {
        ProductVariant variant = productVariantRepository.findById(variantId).orElseThrow();
        return cartItemRepository.save(CartItem.builder().member(member).variant(variant).qty(1).build()).getId();
    }

    private CheckoutRequest request(Long cartItemId) {
        return new CheckoutRequest("王小明", "0912345678", null, ShippingMethod.HOME, "台北市信義區某路 1 號",
                PaymentMethod.COD, null, memberCoupon.getId(), List.of(cartItemId));
    }

    @Test
    void 同一張券同時結帳兩次_只能有一筆訂單用到券() throws Exception {
        Long cartItemA = addToCart(((Number) variantStockList.get(0).get("id")).longValue());
        Long cartItemB = addToCart(((Number) variantStockList.get(1).get("id")).longValue());

        // 兩個執行緒都「查完券」之後才一起往下走，等於兩個請求在同一瞬間檢查 used_at
        CyclicBarrier bothCheckedCoupon = new CyclicBarrier(2);
        doAnswer(invocation -> {
            // 用目前交易的 EntityManager 查，查到的券跟原本一樣在交易裡被追蹤，之後 setUsedAt 才會被寫回
            Long id = invocation.getArgument(0);
            Long memberId = invocation.getArgument(1);
            Optional<MemberCoupon> result = em.createQuery(
                            "SELECT mc FROM MemberCoupon mc WHERE mc.id = :id AND mc.member.id = :memberId", MemberCoupon.class)
                    .setParameter("id", id)
                    .setParameter("memberId", memberId)
                    .getResultStream().findFirst();
            bothCheckedCoupon.await(10, TimeUnit.SECONDS);
            return result;
        }).when(memberCouponRepository).findByIdAndMemberId(anyLong(), anyLong());

        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<?>> futureList = List.of(
                pool.submit(() -> checkoutService.checkout(request(cartItemA))),
                pool.submit(() -> checkoutService.checkout(request(cartItemB))));
        pool.shutdown();

        int successCount = 0;
        List<String> failureList = new ArrayList<>();
        for (Future<?> future : futureList) {
            try {
                future.get(30, TimeUnit.SECONDS);
                successCount++;
            } catch (Exception e) {
                failureList.add(String.valueOf(e.getCause()));
            }
        }

        Integer ordersUsingCoupon = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE member_coupon_id = ?", Integer.class, memberCoupon.getId());
        System.out.println("===== 結帳成功 " + successCount + " 次，失敗：" + failureList
                + "，用到這張券的訂單有 " + ordersUsingCoupon + " 筆 =====");

        assertEquals(1, successCount, "同一張券應該只有一個請求能結帳成功");
        assertEquals(1, ordersUsingCoupon, "同一張券應該只被一張訂單使用");
    }
}
