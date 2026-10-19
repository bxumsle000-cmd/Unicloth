package com.EEIT25.unicloth.dto.admin;

import com.EEIT25.unicloth.enums.Department;

/**
 * @param staffId    員工 id
 * @param token      員工專用的 JWT，打後台 API 時放在 Authorization header
 * @param name       員工姓名，畫面右上角顯示用
 * @param department 所屬部門，前端用來決定進哪個部門的頁面
 */
public record StaffLoginResponse(
        Long staffId,
        String token,
        String name,
        Department department,
        String account
) {
}
