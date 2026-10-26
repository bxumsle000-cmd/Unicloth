package com.EEIT25.unicloth.enums.coupon;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 預約發送的狀態：等待中 / 已發送 / 未發送（時間到時券已停用）/ 已取消<br>
 * DB 存的是 name()，例如 "PENDING"
 */
@Getter
@RequiredArgsConstructor
public enum CouponScheduleStatus {
    PENDING("等待中"),
    SENT("已發送"),
    FAILED("未發送"),
    CANCELLED("已取消");

    // 畫面上顯示的中文
    private final String label;
}
