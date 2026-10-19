package com.EEIT25.unicloth.dto.staff;

import com.EEIT25.unicloth.enums.Department;

/**
 * 新增員工；密碼不用傳，跟重設密碼一樣由系統產生亂數臨時密碼
 *
 * @param account    登入帳號，例如 sys01；建立後不能改
 * @param name       員工姓名
 * @param department 所屬部門，例如 PRODUCT
 */
public record CreateNewStaffRequest(
        String account,
        String name,
        Department department
) {
}
