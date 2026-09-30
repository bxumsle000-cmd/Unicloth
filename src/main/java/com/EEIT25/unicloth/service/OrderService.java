package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.order.CheckoutRequest;
import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CartItemRepository;
import com.EEIT25.unicloth.repository.MemberCouponRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 訂單相關服務，都是針對目前登入的會員<br>
 * - {@link #checkout(CheckoutRequest)}：結帳（購物車勾選的項目 → 訂單）
 */
@Service
@RequiredArgsConstructor
public class OrderService {
    // 運費規則：商品小計滿 2500 免運，否則 50（同前端公告「全館滿 NT$2,500 免運」）
    private static final int FREE_SHIPPING_THRESHOLD = 2500;
    private static final int SHIPPING_FEE = 50;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MemberRepository memberRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final CurrentMember currentMember;

    /**
     * 結帳：把購物車裡勾選的項目建成一張訂單，沒勾的留在購物車。<br>
     * 扣庫存、使用折價券、移除已結帳的購物車項目都在同一個交易裡，任何一步失敗就全部還原。
     */
    @Transactional
    public void checkout(CheckoutRequest request){
        // 1. 目前登入的會員
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(() -> ApiException.unauthorized("登入過期或失效"));

        // 2. 勾選的購物車項目（SKU、商品一起 JOIN FETCH 進來）
        //    撈到的筆數要跟勾選的一樣多；少了代表有 id 不是自己的，或已經從購物車刪掉
        if (request.cartItemIdList() == null || request.cartItemIdList().isEmpty()) {
            throw ApiException.badRequest("請至少勾選一件商品");
        }
        List<CartItem> cartItemList = cartItemRepository.findSelectedWithProducts(member.getId(), request.cartItemIdList());
        if (cartItemList.size() != request.cartItemIdList().size()) {
            throw ApiException.badRequest("有勾選的商品不在你的購物車裡，請重新整理購物車");
        }

        // 3. 檢查商品都還在上架，順便算小計
        int subtotal = 0;
        for (CartItem cartItem : cartItemList) {
            Product product = cartItem.getVariant().getProduct();
            if (!"on_sale".equals(product.getStatus())) {
                throw ApiException.conflict("「" + product.getName() + "」已下架，請先從購物車移除");
            }
            subtotal += product.getPrice() * cartItem.getQty();
        }

        // 4. 折價券（有選才處理）：要是自己的、未使用、未過期、有達到最低消費
        MemberCoupon memberCoupon = null;
        int discount = 0;
        if (request.memberCouponId() != null) {
            memberCoupon = memberCouponRepository.findByIdAndMemberId(request.memberCouponId(), member.getId())
                    .orElseThrow(() -> ApiException.notFound("沒有找到這張折價券"));
            Coupon coupon = memberCoupon.getCoupon();

            if (memberCoupon.getUsedAt() != null) {
                throw ApiException.conflict("這張折價券已經使用過");
            }
            if (!memberCoupon.getExpireAt().isAfter(LocalDateTime.now())) {
                throw ApiException.conflict("這張折價券已過期");
            }
            if (subtotal < coupon.getMinSubtotal()) {
                throw ApiException.badRequest("未達這張折價券的最低消費");
            }

            // 折抵規則同 UsableCouponResponse（結帳頁顯示的金額），改規則時兩邊要一起改
            switch (coupon.getType()) {
                // 折固定金額，最多折到 0 元
                case "amount" -> discount = Math.min(coupon.getValue(), subtotal);
                // 折 %，小數無條件捨去
                case "percent" -> discount = subtotal * coupon.getValue() / 100;
            }
        }

        // 5. 運費、實付金額
        int shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
        int total = subtotal - discount + shippingFee;

        // 6. 扣庫存：用一條 UPDATE 同時檢查和扣掉，兩個人同時結帳也不會超賣
        //    庫存不足時更新 0 筆 → 丟例外，整筆結帳還原
        for (CartItem cartItem : cartItemList) {
            int updated = productVariantRepository.deductStock(cartItem.getVariant().getId(), cartItem.getQty());
            if (updated == 0) {
                throw ApiException.conflict("「" + cartItem.getVariant().getProduct().getName() + "」庫存不足");
            }
        }

        // 7. 產生訂單編號，例如 UC20260901-8842；撞號就重抽
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String orderNo;
        do {
            orderNo = "UC" + date + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
        } while (orderRepository.existsByOrderNo(orderNo));

        // 8. 存訂單主檔
        Order order = orderRepository.save(Order.builder()
                .orderNo(orderNo)
                .member(member)
                .receiverName(request.receiverName())
                .receiverPhone(request.receiverPhone())
                .shippingMethod(request.shippingMethod())
                .shippingAddress(request.shippingAddress())
                .paymentMethod(request.paymentMethod())
                .note(request.note())
                .subtotal(subtotal)
                .discount(discount)
                .shippingFee(shippingFee)
                .total(total)
                .memberCoupon(memberCoupon)
                .build());

        // 9. 存訂單明細：商品名稱、顏色、尺寸、單價都複製一份當快照
        List<OrderItem> orderItemList = new ArrayList<>();
        for (CartItem cartItem : cartItemList) {
            ProductVariant variant = cartItem.getVariant();
            Product product = variant.getProduct();
            orderItemList.add(OrderItem.builder()
                    .order(order)
                    .variant(variant)
                    .productName(product.getName())
                    .color(variant.getColor())
                    .size(variant.getSize())
                    .imageUrl(variant.getUrl())
                    .unitPrice(product.getPrice())
                    .qty(cartItem.getQty())
                    .totalPrice(product.getPrice() * cartItem.getQty())
                    .build());
        }
        orderItemRepository.saveAll(orderItemList);

        // 10. 折價券標記為已使用，並記錄用在哪張訂單
        if (memberCoupon != null) {
            memberCoupon.setUsedAt(LocalDateTime.now());
            memberCoupon.setOrder(order);
        }

        // 11. 從購物車移除已結帳的項目（沒勾的留著）
        cartItemRepository.deleteAll(cartItemList);
    }
}
