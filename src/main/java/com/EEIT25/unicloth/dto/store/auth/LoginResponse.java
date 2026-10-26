package com.EEIT25.unicloth.dto.store.auth;

/**
 * @param memberId         會員 ID
 * @param token            登入 token（JWT）
 * @param profileCompleted 個人資料填了沒；false 時前端要導去補填頁
 */
public record LoginResponse(
        Long memberId,
        String token,
        boolean profileCompleted
) {
}
