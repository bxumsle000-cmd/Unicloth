package com.EEIT25.unicloth.security;

import com.EEIT25.unicloth.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 驗證前端送來的 Firebase ID token，確認「這個人真的用 Google 登入過 Firebase」。
 * <p>
 * Firebase 的 ID token 本身也是一顆 JWT，用 Google 的私鑰簽（RS256）。我們用 Google 公開的公鑰驗簽章，
 * 再照 Firebase 官方文件檢查這幾項：
 * <ul>
 *   <li>exp：還沒過期</li>
 *   <li>iss：{@code https://securetoken.google.com/<專案ID>}</li>
 *   <li>aud：是我們的專案 ID（別人專案發的 token 不能拿來登入我們的網站）</li>
 *   <li>sub：不可空白，它就是 Firebase 的使用者 uid</li>
 * </ul>
 * 公鑰會由 NimbusJwtDecoder 第一次用到時去 Google 下載並快取，所以不需要 service account 金鑰。
 */
@Slf4j
@Component
public class FirebaseTokenVerifier {
    /** Google 放 Firebase 公鑰的網址（JWK 格式） */
    static final String JWK_SET_URI =
            "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

    // 沒設定 projectId 時是 null
    private final NimbusJwtDecoder decoder;

    @Autowired
    public FirebaseTokenVerifier(FirebaseProperties props) {
        this(props.projectId(), NimbusJwtDecoder.withJwkSetUri(JWK_SET_URI).build());
    }

    /** 測試用：換成用自己產生的公鑰驗簽章的 decoder */
    FirebaseTokenVerifier(String projectId, NimbusJwtDecoder decoder) {
        if (!StringUtils.hasText(projectId)) {
            this.decoder = null;
            return;
        }
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                // 預設的 exp / nbf 檢查 + iss 檢查
                JwtValidators.createDefaultWithIssuer("https://securetoken.google.com/" + projectId),
                new JwtClaimValidator<List<String>>(JwtClaimNames.AUD, aud -> aud != null && aud.contains(projectId)),
                new JwtClaimValidator<String>(JwtClaimNames.SUB, StringUtils::hasText)));
        this.decoder = decoder;
    }

    /**
     * @param idToken 前端 Firebase SDK 拿到的 ID token
     * @return token 裡的使用者資料
     * @throws ApiException 401：token 無效或過期；503：伺服器還沒設定 firebase.project-id
     */
    public FirebaseUser verify(String idToken) {
        if (decoder == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "伺服器尚未設定 Firebase，暫時無法使用 Google 登入");
        }

        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException e) {
            log.debug("Firebase ID token 驗證失敗：{}", e.getMessage());
            throw ApiException.unauthorized("Google 登入驗證失敗，請重新登入");
        }

        return new FirebaseUser(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")));
    }

    /**
     * @param uid           Firebase 使用者 uid（每個 Google 帳號固定不變）
     * @param email         Google 帳號的 email；理論上 Google 登入一定有，但還是要防 null
     * @param emailVerified Google 是否確認過這個 email 屬於本人
     */
    public record FirebaseUser(String uid, String email, boolean emailVerified) {
    }
}
