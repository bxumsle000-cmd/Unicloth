package com.EEIT25.unicloth.dto.auth;

/**
 * @param memberId 會員 ID
 * @param token    登入 token
 */
public record LoginResponse(
        Long memberId,
        String token
) {
}
