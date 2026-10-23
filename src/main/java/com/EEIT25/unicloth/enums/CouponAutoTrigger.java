package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 折價券的自動發送時機（Coupon.autoTrigger，null = 只能手動發）<br>
 * DB 存的是 name()，例如 "SIGNUP"
 */
@Getter
@RequiredArgsConstructor
public enum CouponAutoTrigger {
    SIGNUP("註冊禮"),
    BIRTHDAY("生日禮");

    // 畫面上顯示的中文
    private final String label;
}
