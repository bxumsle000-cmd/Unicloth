package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 配送方式：宅配 / 超商取貨<br>
 * DB 存的是 name()，例如 "HOME"
 */
@Getter
@RequiredArgsConstructor
public enum ShippingMethod {
    HOME("宅配"),
    CVS("超商取貨");

    // 畫面上顯示的中文
    private final String label;
}
