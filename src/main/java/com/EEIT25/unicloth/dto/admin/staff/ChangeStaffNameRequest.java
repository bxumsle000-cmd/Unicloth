package com.EEIT25.unicloth.dto.admin.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @param name 新的員工姓名；長度上限跟 staff.name 欄位一樣是 50
 */
public record ChangeStaffNameRequest(
        @NotBlank String name
) {
}
