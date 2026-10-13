package com.EEIT25.unicloth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 的產生與解析：只負責「token ↔ 會員 id」的轉換，不碰資料庫、也不碰 Spring Security。
 * <p>
 * 一顆 JWT 長這樣：{@code header.payload.signature}（三段用「.」隔開）
 * <ul>
 *   <li>header：演算法（jjwt 依金鑰長度自動挑：32 bytes → HS256，64 bytes → HS512）</li>
 *   <li>payload：sub = 會員 id、iat = 簽發時間、exp = 過期時間</li>
 *   <li>signature：用 secret 算出的簽章，證明「這是我們發的、沒被改過」</li>
 * </ul>
 * payload 只是 Base64 編碼、<b>不是加密</b>，任何人都能解開來看，不要放敏感資料。
 */
@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(JwtProperties props) {
        this.key = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
        this.expirationMs = props.expirationMs();
    }

    /** 登入成功後產生 token；會員 id 放在 sub（JWT 規定 sub 是字串） */
    public String generateToken(Long memberId) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .issuedAt(now)
                .expiration(expiration)
                .signWith(key)
                .compact();
    }

    /**
     * 驗證 token（簽章、是否過期）並取出會員 id。
     *
     * @param token 前端帶來的 token（不含 "Bearer " 前綴）
     * @throws JwtException 簽章錯誤、格式錯誤、已過期等任何驗證失敗的情況
     */
    public Long parseMemberId(String token) throws JwtException {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        try {
            return Long.valueOf(claims.getSubject());
        } catch (NumberFormatException e) {
            // 簽章對但 sub 不是數字：不是我們發的格式，一樣當成無效 token
            throw new MalformedJwtException("token 的 sub 不是會員 id", e);
        }
    }
}
