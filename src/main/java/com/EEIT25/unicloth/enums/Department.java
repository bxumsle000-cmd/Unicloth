package com.EEIT25.unicloth.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 後台部門<br>
 * DB（staff.department）存的是 name()，例如 "PRODUCT"；一個員工只屬於一個部門
 * <p>
 * 權限只看部門：每個部門有自己的頁面，API 放在 /api/admin/部門代號小寫/ 底下（例如 /api/admin/product/），
 * SecurityConfig 依路徑檢查員工有沒有這個部門。
 */
@Getter
@RequiredArgsConstructor
public enum Department {
    PRODUCT("商品部"),
    ORDER("訂單物流"),
    CS("客服"),
    MKT("行銷"),
    ADMIN("系統管理");

    // 畫面上顯示的中文
    private final String label;
}
