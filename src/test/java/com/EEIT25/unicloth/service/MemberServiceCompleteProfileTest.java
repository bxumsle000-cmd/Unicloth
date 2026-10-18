package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.member.CompleteProfileRequest;
import com.EEIT25.unicloth.dto.member.MemberResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberProfileRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * 補填個人資料的行為測試（連真的資料庫，每個測試結束都會 rollback）。
 * 測試自己建一個「用 Google 登入、還沒補填資料」的會員，再把 CurrentMember 換成假的，讓它回傳這個會員。
 */
@SpringBootTest
@Transactional
class MemberServiceCompleteProfileTest {

    @Autowired
    MemberService memberService;
    @Autowired MemberRepository memberRepository;
    @Autowired MemberProfileRepository memberProfileRepository;

    @MockitoBean CurrentMember currentMember;

    Member member;

    @BeforeEach
    void setUp() {
        member = memberRepository.save(Member.builder()
                .email("google-only@example.com")
                .firebaseUid("uid-complete-profile")
                .build());
        when(currentMember.require()).thenReturn(member);
        when(currentMember.getCurrentId()).thenReturn(member.getId());
    }

    private CompleteProfileRequest request() {
        return new CompleteProfileRequest("王小美", "0912345678", "female", LocalDate.of(1998, 5, 20), null);
    }

    @Test
    void 還沒補填_查自己的資料_profileCompleted是false() {
        MemberResponse me = memberService.getMe();

        assertThat(me.profileCompleted()).isFalse();
        assertThat(me.email()).isEqualTo("google-only@example.com");
        assertThat(me.name()).isNull();
    }

    @Test
    void 補填完_資料存進member_profiles() {
        MemberResponse response = memberService.completeProfile(request());

        assertThat(response.profileCompleted()).isTrue();
        assertThat(response.name()).isEqualTo("王小美");
        assertThat(memberProfileRepository.findById(member.getId()).orElseThrow().getPhone()).isEqualTo("0912345678");
        assertThat(memberService.getMe().profileCompleted()).isTrue();
    }

    @Test
    void 已經補填過_再補填一次_409() {
        memberService.completeProfile(request());

        assertThatThrownBy(() -> memberService.completeProfile(request()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }
}
