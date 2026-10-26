package com.EEIT25.unicloth.dto.admin.staff;

import com.EEIT25.unicloth.enums.staff.Department;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 新增員工；密碼不用傳，跟重設密碼一樣由系統產生亂數臨時密碼
 *
 * @param account    登入帳號，例如 sys01；建立後不能改，長度上限跟 staff.account 欄位一樣是 50
 * @param name       員工姓名，長度上限跟 staff.name 欄位一樣是 50
 * @param department 所屬部門，例如 PRODUCT
 */
public record CreateNewStaffRequest(
        @NotBlank(message = "請輸入帳號")  String account,
        @NotBlank(message = "請輸入姓名")  String name,
        @NotNull(message = "請選擇部門") Department department
) {
}
