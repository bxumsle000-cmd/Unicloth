package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.auth.FirebaseLoginRequest;
import com.EEIT25.unicloth.dto.auth.LoginRequest;
import com.EEIT25.unicloth.dto.auth.LoginResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.enums.MemberStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.security.FirebaseTokenVerifier;
import com.EEIT25.unicloth.security.FirebaseTokenVerifier.FirebaseUser;
import com.EEIT25.unicloth.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Google 登入的行為測試（連真的資料庫，每個測試結束都會 rollback）。
 * FirebaseTokenVerifier 換成假的：直接指定「這顆 token 驗證完是哪個 Google 帳號」，不用真的去 Google 登入。
 */
@SpringBootTest
@Transactional
class AuthServiceFirebaseLoginTest {

    private static final String ID_TOKEN = "fake-firebase-id-token";

    @Autowired AuthService authService;
    @Autowired MemberRepository memberRepository;
    @Autowired JwtService jwtService;

    @MockitoBean FirebaseTokenVerifier firebaseTokenVerifier;

    private LoginResponse loginAs(String uid, String email, boolean emailVerified) {
        when(firebaseTokenVerifier.verify(ID_TOKEN)).thenReturn(new FirebaseUser(uid, email, emailVerified));
        return authService.firebaseLogin(new FirebaseLoginRequest(ID_TOKEN));
    }

    @Test
    void 第一次登入_建新會員且沒有密碼() {
        LoginResponse response = loginAs("uid-new", "google-new@example.com", true);

        Member member = memberRepository.findById(response.memberId()).orElseThrow();
        assertThat(member.getEmail()).isEqualTo("google-new@example.com");
        assertThat(member.getFirebaseUid()).isEqualTo("uid-new");
        assertThat(member.getPasswordHash()).isNull();
        // 新會員還沒有個人資料，前端要導去補填頁
        assertThat(response.profileCompleted()).isFalse();
        // 回傳的是我們自己的 JWT，解回來是同一個會員
        assertThat(jwtService.parseMemberId(response.token())).isEqualTo(member.getId());
    }

    @Test
    void 第二次登入_找到同一個會員_不會重複建() {
        Long firstId = loginAs("uid-again", "google-again@example.com", true).memberId();
        long count = memberRepository.count();

        Long secondId = loginAs("uid-again", "google-again@example.com", true).memberId();

        assertThat(secondId).isEqualTo(firstId);
        assertThat(memberRepository.count()).isEqualTo(count);
    }

    @Test
    void email已經用密碼註冊過_綁定到原本的帳號() {
        Member existing = memberRepository.save(Member.builder()
                .email("password-user@example.com")
                .passwordHash("x")
                .build());

        Long memberId = loginAs("uid-link", "password-user@example.com", true).memberId();

        assertThat(memberId).isEqualTo(existing.getId());
        assertThat(existing.getFirebaseUid()).isEqualTo("uid-link");
    }

    @Test
    void email已經註冊過但Google沒驗證email_409() {
        memberRepository.save(Member.builder()
                .email("unverified@example.com")
                .passwordHash("x")
                .build());

        assertThatThrownBy(() -> loginAs("uid-unverified", "unverified@example.com", false))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void email的帳號已經綁了別的Google帳號_409() {
        memberRepository.save(Member.builder()
                .email("taken@example.com")
                .firebaseUid("uid-original")
                .build());

        assertThatThrownBy(() -> loginAs("uid-other", "taken@example.com", true))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void 帳號被停用_403() {
        memberRepository.save(Member.builder()
                .email("disabled@example.com")
                .firebaseUid("uid-disabled")
                .status(MemberStatus.DISABLED)
                .build());

        assertThatThrownBy(() -> loginAs("uid-disabled", "disabled@example.com", true))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void Google登入建的會員_不能用密碼登入() {
        loginAs("uid-no-password", "no-password@example.com", true);

        assertThatThrownBy(() -> authService.login(
                new LoginRequest("no-password@example.com", "anything")))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
