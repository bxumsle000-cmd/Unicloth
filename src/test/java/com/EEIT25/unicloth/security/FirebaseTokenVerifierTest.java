package com.EEIT25.unicloth.security;

import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.security.FirebaseTokenVerifier.FirebaseUser;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPublicKey;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 純單元測試，不連網路：自己產生一組 RSA 金鑰假裝是 Google，
 * 用私鑰簽出「長得像 Firebase ID token」的 JWT，再驗證 FirebaseTokenVerifier 的檢查規則。
 */
class FirebaseTokenVerifierTest {

    private static final String PROJECT_ID = "unicloth-test";
    private static final String ISSUER = "https://securetoken.google.com/" + PROJECT_ID;

    private static final KeyPair GOOGLE_KEY = newKeyPair();

    private static KeyPair newKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private FirebaseTokenVerifier verifier(String projectId) {
        return new FirebaseTokenVerifier(projectId,
                NimbusJwtDecoder.withPublicKey((RSAPublicKey) GOOGLE_KEY.getPublic()).build());
    }

    /** 一顆正常的 Firebase ID token 的內容；各測試再改掉其中一項 */
    private JWTClaimsSet.Builder validClaims() {
        Date now = new Date();
        return new JWTClaimsSet.Builder()
                .issuer(ISSUER)
                .audience(PROJECT_ID)
                .subject("firebase-uid-123")
                .issueTime(now)
                .expirationTime(new Date(now.getTime() + 3_600_000))
                .claim("email", "amy@gmail.com")
                .claim("email_verified", true);
    }

    private String sign(JWTClaimsSet claims, KeyPair key) throws JOSEException {
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
        jwt.sign(new RSASSASigner(key.getPrivate()));
        return jwt.serialize();
    }

    @Test
    void 正常的token_取出uid和email() throws Exception {
        FirebaseUser user = verifier(PROJECT_ID).verify(sign(validClaims().build(), GOOGLE_KEY));

        assertThat(user.uid()).isEqualTo("firebase-uid-123");
        assertThat(user.email()).isEqualTo("amy@gmail.com");
        assertThat(user.emailVerified()).isTrue();
    }

    @Test
    void 沒有email_verified欄位_當成沒驗證() throws Exception {
        String token = sign(validClaims().claim("email_verified", null).build(), GOOGLE_KEY);

        assertThat(verifier(PROJECT_ID).verify(token).emailVerified()).isFalse();
    }

    @Test
    void 別的專案發的token_401() throws Exception {
        String token = sign(validClaims().audience("someone-else").build(), GOOGLE_KEY);

        assertUnauthorized(token);
    }

    @Test
    void 發行者不對_401() throws Exception {
        String token = sign(validClaims().issuer("https://evil.example.com").build(), GOOGLE_KEY);

        assertUnauthorized(token);
    }

    @Test
    void 過期的token_401() throws Exception {
        Date past = new Date(System.currentTimeMillis() - 3_600_000);   // 一小時前就過期（超過預設容許的 60 秒誤差）
        String token = sign(validClaims().issueTime(new Date(past.getTime() - 60_000)).expirationTime(past).build(), GOOGLE_KEY);

        assertUnauthorized(token);
    }

    @Test
    void 不是Google私鑰簽的_401() throws Exception {
        String token = sign(validClaims().build(), newKeyPair());

        assertUnauthorized(token);
    }

    @Test
    void 沒有sub_401() throws Exception {
        String token = sign(validClaims().subject(null).build(), GOOGLE_KEY);

        assertUnauthorized(token);
    }

    @Test
    void 亂七八糟的字串_401() {
        assertUnauthorized("not-a-jwt");
    }

    @Test
    void 沒設定projectId_503() throws Exception {
        String token = sign(validClaims().build(), GOOGLE_KEY);

        assertThatThrownBy(() -> verifier("").verify(token))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    private void assertUnauthorized(String token) {
        assertThatThrownBy(() -> verifier(PROJECT_ID).verify(token))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
