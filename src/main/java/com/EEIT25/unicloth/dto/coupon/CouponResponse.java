package com.EEIT25.unicloth.dto.coupon;

import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.entity.MemberCoupon;

import java.time.LocalDateTime;

/**
 * 會員持有的一張折價券
 *
 * @param id          會員持有這張券的 id（MemberCoupon.id）；結帳套用券時前端要傳回來
 * @param code        折扣碼
 * @param title       券名稱，例如 新會員 100 元折價券
 * @param type        amount / percent / shipping
 * @param value       amount → 折多少元；percent → 折幾 %（10 = 9 折）；shipping → 0
 * @param minSubtotal 最低消費
 * @param expireAt    到期時間
 * @param status      usable（可使用）/ used（已使用）/ expired（已過期）
 */
public record CouponResponse(
        Long id,
        String code,
        String title,
        String type,
        int value,
        int minSubtotal,
        LocalDateTime expireAt,
        String status
) {

    /**
     * @param memberCoupon 會員持有的一張券（coupon 要先 join fetch，避免 LazyInitializationException）
     */
    public static CouponResponse from(MemberCoupon memberCoupon){
        Coupon coupon = memberCoupon.getCoupon();

        String status;
        if (memberCoupon.getUsedAt() != null) {
            status = "used";
        } else if (memberCoupon.getExpireAt().isBefore(LocalDateTime.now())) {
            status = "expired";
        } else {
            status = "usable";
        }

        return new CouponResponse(
                memberCoupon.getId(),
                coupon.getCode(),
                coupon.getTitle(),
                coupon.getType(),
                coupon.getValue(),
                coupon.getMinSubtotal(),
                memberCoupon.getExpireAt(),
                status);
    }
}
