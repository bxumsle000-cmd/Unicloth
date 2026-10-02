package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 商品狀態：上架中 / 已下架<br>
 * DB 存的是 name()，例如 "ON_SALE"
 */
@Getter
@RequiredArgsConstructor
public enum ProductStatus {
    ON_SALE("上架中"),
    OFF_SHELF("已下架");

    // 畫面上顯示的中文
    private final String label;
}
