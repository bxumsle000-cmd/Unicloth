package com.EEIT25.unicloth.enums.staff;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 員工帳號狀態：正常 / 停用（停用的帳號不能登入後台）<br>
 * DB 存的是 name()，例如 "ACTIVE"
 */
@Getter
@RequiredArgsConstructor
public enum StaffStatus {
    ACTIVE("正常"),
    DISABLED("停用");

    // 畫面上顯示的中文
    private final String label;
}
