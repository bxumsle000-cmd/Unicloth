package com.EEIT25.unicloth.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * @param email    Email
 * @param password 密碼
 */
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {
}
