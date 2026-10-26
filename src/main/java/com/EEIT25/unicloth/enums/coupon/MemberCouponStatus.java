package com.EEIT25.unicloth.enums.coupon;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

/**
 * 會員持有的一張券現在的狀態：可使用 / 已使用 / 已過期<br>
 * 不存在 DB，由 MemberCoupon 的 usedAt、expireAt 算出來
 */
@Getter
@RequiredArgsConstructor
public enum MemberCouponStatus {
    USABLE("可使用"),
    USED("已使用"),
    EXPIRED("已過期");

    // 畫面上顯示的中文
    private final String label;

    /** 用過就是已使用；還沒用、但過了到期時間是已過期；其餘是可使用 */
    public static MemberCouponStatus of(LocalDateTime usedAt, LocalDateTime expireAt) {
        if (usedAt != null) {
            return USED;
        }
        if (expireAt.isBefore(LocalDateTime.now())) {
            return EXPIRED;
        }
        return USABLE;
    }
}
