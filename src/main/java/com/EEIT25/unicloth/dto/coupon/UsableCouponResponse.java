package com.EEIT25.unicloth.dto.coupon;

import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.MemberCoupon;

import java.time.LocalDateTime;

/**
 * 結帳時可選的一張折價券（未使用、未過期）
 *
 * @param id               會員持有這張券的 id（MemberCoupon.id）；結帳套用券時前端要傳回來
 * @param code             折扣碼
 * @param title            券名稱，例如 新會員 100 元折價券
 * @param type             AMOUNT / PERCENT（沒有免運券）
 * @param value            amount → 折多少元；percent → 折幾 %（10 = 9 折）
 * @param minSubtotal      最低消費
 * @param expireAt         到期時間
 * @param meetsMinSubtotal 這次的小計是否達到最低消費；false 時前端顯示但不能選
 * @param discount         用這張券這次能折多少元；meetsMinSubtotal 為 false 時是 0
 */
public record UsableCouponResponse(
        Long id,
        String code,
        String title,
        String type,
        int value,
        int minSubtotal,
        LocalDateTime expireAt,
        boolean meetsMinSubtotal,
        int discount
) {

    // 運費規則：商品小計滿 2500 免運，否則 50（同 CheckoutService）
    private static final int FREE_SHIPPING_THRESHOLD = 2500;
    private static final int SHIPPING_FEE = 50;

    /**
     * @param memberCoupon 會員持有的一張券（coupon 要先 join fetch，避免 LazyInitializationException）
     * @param subtotal     購物車小計（商品總價，不含運費）
     */
    public static UsableCouponResponse from(MemberCoupon memberCoupon, int subtotal){
        Coupon coupon = memberCoupon.getCoupon();

        boolean meetsMinSubtotal = subtotal >= coupon.getMinSubtotal();

        int discount = 0;
        if (meetsMinSubtotal) {
            switch (coupon.getType()) {
                // 折固定金額，最多折到 0 元
                case AMOUNT -> discount = Math.min(coupon.getValue(), subtotal);
                // 折 %，小數無條件捨去
                case PERCENT -> discount = subtotal * coupon.getValue() / 100;
            }
        }

        return new UsableCouponResponse(
                memberCoupon.getId(),
                coupon.getCode(),
                coupon.getTitle(),
                coupon.getType().name(),
                coupon.getValue(),
                coupon.getMinSubtotal(),
                memberCoupon.getExpireAt(),
                meetsMinSubtotal,
                discount);
    }
}
