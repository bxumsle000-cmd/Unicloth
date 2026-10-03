package com.EEIT25.unicloth.dto.coupon;

import jakarta.validation.constraints.NotNull;

/**
 * 發券給會員
 *
 * @param memberId 要發給哪個會員
 * @param couponId 折價券範本的 id（Coupon.id，不是 MemberCoupon.id）
 */
public record GrantCouponRequest(
        @NotNull Long memberId,
        @NotNull Long couponId
) {
}
