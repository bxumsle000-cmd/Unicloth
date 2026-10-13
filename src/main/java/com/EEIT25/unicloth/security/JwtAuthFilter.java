package com.EEIT25.unicloth.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT 認證過濾器：每個請求進來時，看有沒有帶 token，有就驗證並「標記這個請求是哪個會員發的」。
 * <ol>
 *   <li>讀 {@code Authorization: Bearer <token>}</li>
 *   <li>沒帶、格式不對、驗證失敗（過期、被竄改）→ 什麼都不做，直接放行</li>
 *   <li>驗證成功 → 把會員 id 放進 SecurityContext，之後 {@link CurrentMember} 就能取得</li>
 * </ol>
 * 這個 Filter 本身<b>從不</b>回 401，它只負責「辨識身分」；「要不要擋」交給 {@link SecurityConfig} 的授權規則，
 * 這樣看商品這些不用登入的 API 才能正常放行。
 * <p>
 * 注意：故意<b>不加</b> {@code @Component}。Spring Boot 會把 Filter 型別的 Bean 自動註冊成一般 Servlet Filter，
 * 會在 Security 的過濾鏈之外「再跑一次」。正確做法是在 SecurityConfig 裡 new 出來、用 addFilterBefore 掛進去。
 */
@Slf4j
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null) {
            try {
                Long memberId = jwtService.parseMemberId(token);
                setAuthenticated(memberId, request);
            } catch (JwtException e) {
                // token 無效：不放身分進 SecurityContext，受保護的 API 會因為「未登入」回 401
                log.debug("JWT 驗證失敗：{}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    /** 從 Authorization header 取出 token；沒帶或不是 Bearer 格式回 null */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            return null;
        }
        return header.substring(BEARER_PREFIX.length()).trim();
    }

    /** 把已驗證的會員 id 放進 SecurityContext（principal 就是會員 id） */
    private void setAuthenticated(Long memberId, HttpServletRequest request) {
        // credentials 用不到給 null；目前沒有角色區分，先固定給 ROLE_MEMBER
        UsernamePasswordAuthenticationToken auth = UsernamePasswordAuthenticationToken.authenticated(
                memberId, null, List.of(new SimpleGrantedAuthority("ROLE_MEMBER")));
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        // 官方建議：先建一個空的 context 再整個 set 進去
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }
}
