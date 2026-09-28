package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.auth.LoginRequest;
import com.EEIT25.unicloth.dto.auth.LoginResponse;
import com.EEIT25.unicloth.dto.auth.RegisterRequest;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 認證相關服務<br>
 * - {@link #login(LoginRequest)}：會員登入<br>
 * - {@link #register(RegisterRequest)}：會員註冊
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentMember currentMember;

    /** 會員登入：檢查帳號密碼、帳號是否停用，通過後回傳會員 id 和 token；帳號或密碼錯都回同一句，不透露是哪個錯 */
    @Transactional
    public LoginResponse login(LoginRequest request){
        Member member = memberRepository.findByEmail(request.email())
                .orElseThrow(()-> ApiException.unauthorized("帳號或密碼錯誤"));
        if(!passwordEncoder.matches(request.password(), member.getPasswordHash())){
            throw ApiException.unauthorized("帳號或密碼錯誤");
        }
        if(!"active".equals(member.getStatus())){
            throw ApiException.forbidden("此帳號已被停用");
        }

        return new LoginResponse(member.getId(),currentMember.getCurrentToken());
    }

    /** 會員註冊：email 已存在就擋下，密碼加密後才存進資料庫 */
    @Transactional
    public void register(RegisterRequest request){
        if (memberRepository.existsByEmail(request.email())){
            throw ApiException.conflict("此email已經註冊過");
        }

        Member member = Member.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .name(request.name())
                .phone(request.phone())
                .gender(request.gender())
                .birthday(request.birthday())
                .address(request.address())
                .build();
        memberRepository.save(member);
    }


}
