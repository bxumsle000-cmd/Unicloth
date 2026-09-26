package com.EEIT25.unicloth.dto.auth;

/**
 * @param email    Email
 * @param password 密碼
 */
public record LoginRequest(
        String email,
        String password
) {
}
