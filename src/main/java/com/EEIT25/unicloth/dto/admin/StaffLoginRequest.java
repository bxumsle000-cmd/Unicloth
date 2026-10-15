package com.EEIT25.unicloth.dto.admin;

import com.EEIT25.unicloth.enums.Department;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * @param account    員工帳號，例如 sys01
 * @param password   密碼
 * @param department 登入頁選的部門，例如 PRODUCT；要跟員工所屬的部門一樣才能登入
 */
public record StaffLoginRequest(
        @NotBlank String account,
        @NotBlank String password,
        @NotNull Department department
) {
}
