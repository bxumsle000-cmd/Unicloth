
package com.EEIT25.unicloth.security;

import com.EEIT25.unicloth.repository.MemberProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;

/**
 * Spring Security 主要設定。
 * <p>
 * Security 預設會把所有端點鎖住，並啟用 Session、CSRF、表單登入，這些是給傳統伺服器渲染網頁用的，
 * 不適合前後端分離 + JWT，所以這裡改成：
 * <ul>
 *   <li>每個請求先經過 {@link JwtAuthFilter}，有帶有效 token 就標記身分</li>
 *   <li>看商品、看分類、登入（含 Google 登入）、註冊不用登入；其餘 /api/** 一律要登入</li>
 *   <li>登入了但還沒補填個人資料：只能查自己的資料、補填資料，其他 /api/** 回 403</li>
 *   <li>/api 以外（圖片、影片、Swagger、/error）都放行</li>
 *   <li>未登入打到要登入的 API → 401、沒補填資料 → 403，body 跟其他錯誤一樣是 ErrorResponse 格式的 JSON</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtService jwtService;
    private final MemberProfileRepository memberProfileRepository;

    /** 跟 GlobalExceptionHandler 回的格式一樣，前端 kinu.js 會讀 message 顯示 */
    private static final String UNAUTHORIZED_BODY = "{\"code\":401,\"message\":\"尚未登入或登入已失效\"}";
    private static final String PROFILE_REQUIRED_BODY = "{\"code\":403,\"message\":\"請先填寫會員資料\"}";

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF 是防「瀏覽器自動帶 Cookie」的攻擊；JWT 放在 Authorization header，瀏覽器不會自動帶，所以關掉
                .csrf(csrf -> csrf.disable())
                // STATELESS：不建立 HttpSession，每個請求只靠自己帶的 JWT 證明身分
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 登入走自己的 /api/auth/login，不需要 Security 內建的登入頁與 Basic 認證視窗
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                // 沒登入 → 401；登入了但授權規則不通過（目前只有「沒補填資料」這種情況）→ 403
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedEntryPoint())
                        .accessDeniedHandler(profileRequiredHandler()))

                // 授權規則：由上往下比對，第一條符合的生效，所以「放行」要寫在「要登入」前面
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/login", "/api/auth/firebase", "/api/auth/register", "/api/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/categories/**").permitAll()

                        // 綠界付款結果通知：不需要會員 JWT
                        .requestMatchers(HttpMethod.POST,
                                "/api/payments/ecpay/notify").permitAll()

                        // 還沒補填資料也要能用：查自己的資料（前端靠它判斷要不要導去補填頁）、補填資料
                        .requestMatchers(HttpMethod.GET, "/api/member/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/member/me/complete-profile").authenticated()
                        // 新增的 API 只要放在 /api 底下，預設就是要登入「而且」補填過資料
                        .requestMatchers("/api/**").access(profileCompleted())
                        // 圖片、影片、Swagger、/error 等
                        .anyRequest().permitAll()
                )

                // 掛在「表單登入 Filter」的位置之前，讓授權規則判斷時 SecurityContext 已經有身分
                .addFilterBefore(new JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * 授權規則：已登入，而且 member_profiles 有這個會員的資料。
     * 沒登入時回 false，Security 會交給 unauthorizedEntryPoint 回 401；已登入但沒資料才會走到 profileRequiredHandler 回 403。
     * 每個請求都會多查一次資料庫（用主鍵查，很快）。
     */
    private AuthorizationManager<RequestAuthorizationContext> profileCompleted() {
        return (authentication, context) -> {
            var auth = authentication.get();
            boolean completed = auth != null && auth.isAuthenticated()
                    && !(auth instanceof AnonymousAuthenticationToken)
                    && auth.getPrincipal() instanceof Long memberId
                    && memberProfileRepository.existsById(memberId);
            return new AuthorizationDecision(completed);
        };
    }

    /** 登入了但還沒補填資料時的回應：403 + JSON */
    private AccessDeniedHandler profileRequiredHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(403);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(PROFILE_REQUIRED_BODY);
        };
    }

    /** 未登入時的回應：401 + JSON */
    private AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(401);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(UNAUTHORIZED_BODY);
        };
    }
}
