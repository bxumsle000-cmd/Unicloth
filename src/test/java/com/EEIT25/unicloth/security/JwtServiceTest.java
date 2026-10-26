package com.EEIT25.unicloth.security;

import com.EEIT25.unicloth.enums.staff.Department;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 純單元測試，不啟動 Spring：直接 new JwtService 驗證產生 / 解析 token 的行為。
 */
class JwtServiceTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    private JwtService service(long expirationMs) {
        return new JwtService(new JwtProperties(SECRET, expirationMs));
    }

    @Test
    void 產生的token解回來是同一個會員id() {
        JwtService jwt = service(60_000);

        String token = jwt.generateToken(42L);

        assertThat(token.split("\\.")).hasSize(3);          // header.payload.signature
        assertThat(jwt.parseMemberId(token)).isEqualTo(42L);
    }

    @Test
    void 被竄改的token_解析失敗() {
        JwtService jwt = service(60_000);
        String token = jwt.generateToken(42L);

        // 改簽章（第三段）的第一個字元；不改最後一個字元，因為 Base64 最後幾個 bit 是填充用的，改了不一定有影響
        int sigStart = token.lastIndexOf('.') + 1;
        char first = token.charAt(sigStart);
        String tampered = token.substring(0, sigStart)
                + (first == 'A' ? 'B' : 'A')
                + token.substring(sigStart + 1);

        assertThatThrownBy(() -> jwt.parseMemberId(tampered))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void 用不同secret簽的token_解析失敗() {
        String token = new JwtService(new JwtProperties("another-secret-another-secret-another-secret", 60_000))
                .generateToken(42L);

        assertThatThrownBy(() -> service(60_000).parseMemberId(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void 過期的token_解析失敗() throws InterruptedException {
        JwtService jwt = service(1);   // 1 毫秒後過期
        String token = jwt.generateToken(42L);

        Thread.sleep(1_100);           // JWT 的 exp 精度是「秒」，所以要等超過 1 秒

        assertThatThrownBy(() -> jwt.parseMemberId(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void 亂七八糟的字串_解析失敗() {
        assertThatThrownBy(() -> service(60_000).parseMemberId("not-a-jwt"))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void 員工token解回來_是員工而且部門一樣() {
        JwtService jwt = service(60_000);

        String token = jwt.generateStaffToken(5L, Department.MKT);
        JwtService.ParsedToken parsed = jwt.parse(token);

        assertThat(parsed.staff()).isTrue();
        assertThat(parsed.id()).isEqualTo(5L);
        assertThat(parsed.department()).isEqualTo(Department.MKT);
    }

    @Test
    void 會員token_parse出來不是員工() {
        JwtService jwt = service(60_000);

        JwtService.ParsedToken parsed = jwt.parse(jwt.generateToken(42L));

        assertThat(parsed.staff()).isFalse();
        assertThat(parsed.id()).isEqualTo(42L);
    }

    @Test
    void 員工token不能當會員token用() {
        JwtService jwt = service(60_000);
        String token = jwt.generateStaffToken(5L, Department.ADMIN);

        assertThatThrownBy(() -> jwt.parseMemberId(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void 員工token裡有不認識的部門_解析失敗() {
        String token = Jwts.builder()
                .subject("5")
                .claim("dept", "NOT_A_DEPT")
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertThatThrownBy(() -> service(60_000).parse(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void 簽章正確但sub不是數字_解析失敗() {
        String token = Jwts.builder()
                .subject("abc")
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertThatThrownBy(() -> service(60_000).parseMemberId(token))
                .isInstanceOf(JwtException.class);
    }
}
