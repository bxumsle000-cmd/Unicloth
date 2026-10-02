package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 付款方式：信用卡 / ATM 轉帳 / 貨到付款<br>
 * DB 存的是 name()，例如 "CREDIT"
 */
@Getter
@RequiredArgsConstructor
public enum PaymentMethod {
    CREDIT("信用卡"),
    ATM("ATM 轉帳"),
    COD("貨到付款");

    // 畫面上顯示的中文
    private final String label;
}
