package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 會員這張券是怎麼來的（MemberCoupon.source）：手動發 / 各種自動發送<br>
 * DB 存的是 name()，例如 "MANUAL"
 */
@Getter
@RequiredArgsConstructor
public enum CouponSource {
    MANUAL("手動發券"),
    BIRTHDAY("自動：生日禮");

    // 畫面上顯示的中文
    private final String label;
}
