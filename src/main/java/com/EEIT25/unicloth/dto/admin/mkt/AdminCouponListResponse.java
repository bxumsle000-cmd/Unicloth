package com.EEIT25.unicloth.dto.admin.mkt;

import com.EEIT25.unicloth.entity.Coupon;
import java.time.LocalDateTime;

/**
 * 行銷後台折價券範本清單的單筆資料。
 *
 * Coupon 是優惠規則；
 * MemberCoupon 才是會員實際持有的一張券。
 */
public record AdminCouponListResponse(
        Long id,
        String code,
        String title,
        String type,
        Integer value,
        Integer minSubtotal,
        Integer validDays,
        boolean signupGift,
        boolean active,
        LocalDateTime createdAt
) {
    /**
     * 將資料庫折價券範本轉成行銷後台清單資料。
     */
    public static AdminCouponListResponse from(Coupon coupon) {
        return new AdminCouponListResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getTitle(),
                coupon.getType().name(),
                coupon.getValue(),
                coupon.getMinSubtotal(),
                coupon.getValidDays(),
                coupon.isSignupGift(),
                coupon.isActive(),
                coupon.getCreatedAt()
        );
    }
}