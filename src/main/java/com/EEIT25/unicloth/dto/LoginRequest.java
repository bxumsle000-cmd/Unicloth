package com.EEIT25.unicloth.dto;

/**
 * @param email    Email
 * @param password 密碼
 */
public record LoginRequest(
        String email,
        String password
) {
}
