package com.EEIT25.unicloth.dto.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @param oldPassword 舊密碼
 * @param newPassword 新密碼
 */
public record ChangePasswordRequest(
        @NotBlank String oldPassword,
        @NotBlank @Size(min = 8, max = 72, message = "密碼長度需為 8～72 字") String newPassword
) {
}
