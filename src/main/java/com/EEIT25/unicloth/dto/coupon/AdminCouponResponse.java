package com.EEIT25.unicloth.dto.coupon;

import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.enums.CouponAutoTrigger;
import com.EEIT25.unicloth.enums.CouponType;

/**
 * 行銷後台折價券列表的一張券（券的種類，不是會員持有的那張）
 *
 * @param id          折價券 id（Coupon.id）；編輯、停用 / 啟用都用它指定
 * @param code        折扣碼，建立後不能改
 * @param title       券名稱，例如 新會員 100 元折價券
 * @param type        AMOUNT / PERCENT（沒有免運券）
 * @param value       AMOUNT → 折多少元；PERCENT → 折幾 %（10 = 9 折）
 * @param minSubtotal 最低消費
 * @param validDays   領取後幾天內有效
 * @param autoTrigger 自動發送時機，例如 BIRTHDAY；null = 只能手動發
 * @param active      是否啟用；停用後不能再發，已發出的券會員還是能用
 * @param issuedCount 已經發出去幾張；大於 0 時編輯視窗要顯示「已發出的券也會跟著變」
 */
public record AdminCouponResponse(
        Long id,
        String code,
        String title,
        CouponType type,
        int value,
        int minSubtotal,
        int validDays,
        CouponAutoTrigger autoTrigger,
        boolean active,
        long issuedCount
) {

    /**
     * @param coupon 折價券（要在 @Transactional 裡呼叫，memberCoupons 才能 lazy 載入）
     */
    public static AdminCouponResponse from(Coupon coupon){
        return new AdminCouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getTitle(),
                coupon.getType(),
                coupon.getValue(),
                coupon.getMinSubtotal(),
                coupon.getValidDays(),
                coupon.getAutoTrigger(),
                coupon.isActive(),
                coupon.getMemberCoupons().size());
    }
}
