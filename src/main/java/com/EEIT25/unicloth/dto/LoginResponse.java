package com.EEIT25.unicloth.dto;

import com.EEIT25.unicloth.entity.Member;

/**
 * @param memberId 會員 ID
 * @param token    登入 token
 */
public record LoginResponse(
        Long memberId,
        String token
) {
}
