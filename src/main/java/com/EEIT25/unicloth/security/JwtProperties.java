package com.EEIT25.unicloth.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;

/**
 * JWT 相關設定值，對應 application.properties 裡 {@code jwt.*} 的項目。
 * <p>
 * Spring Boot 啟動時會把設定檔的值綁進這個 record（{@code expiration-ms} 會自動對應到 {@code expirationMs}），
 * 要用的地方直接注入 {@code JwtProperties} 即可。
 * 需要 {@link com.EEIT25.unicloth.UniclothApplication} 上的 {@code @ConfigurationPropertiesScan} 才會被註冊成 Bean。
 *
 * @param secret       簽章金鑰，HS256 要求至少 32 bytes
 * @param expirationMs token 有效時間（毫秒）
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        long expirationMs
) {
    /** HS256 的最低金鑰長度：256 bit = 32 bytes */
    private static final int MIN_SECRET_BYTES = 32;

    /** 設定值有錯就在啟動當下爆出來，不要等到第一次登入才發現 */
    public JwtProperties {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalArgumentException(
                    "jwt.secret 至少要 " + MIN_SECRET_BYTES + " bytes，請檢查 application.properties 或環境變數 JWT_SECRET");
        }
        if (expirationMs <= 0) {
            throw new IllegalArgumentException("jwt.expiration-ms 必須大於 0");
        }
    }
}
