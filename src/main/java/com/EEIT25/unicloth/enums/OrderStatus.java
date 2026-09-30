package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 訂單狀態，依流程順序：確認中 → 出貨 → 送達 → 取貨完畢；另外可能被取消<br>
 * DB 存的是 name()，例如 "PENDING"
 */
@Getter
@RequiredArgsConstructor
public enum OrderStatus {
    PENDING("訂單確認中"),
    SHIPPED("已出貨"),
    DELIVERED("已送達"),
    PICKED_UP("取貨完畢"),
    CANCELLED("已取消");

    // 畫面上顯示的中文
    private final String label;
}
