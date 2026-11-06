package com.EEIT25.unicloth.dto.admin.staff;

import jakarta.validation.constraints.NotBlank;

/**
 * @param name 新的員工姓名
 */
public record ChangeStaffNameRequest(
        @NotBlank String name
) {
}
