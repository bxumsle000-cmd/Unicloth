package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 折價券類型：折固定金額 / 折 %（沒有免運券）<br>
 * DB 存的是 name()，例如 "AMOUNT"
 */
@Getter
@RequiredArgsConstructor
public enum CouponType {
    AMOUNT("折抵金額"),
    PERCENT("折扣百分比");

    // 畫面上顯示的中文
    private final String label;
}
