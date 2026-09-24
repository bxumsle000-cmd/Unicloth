package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.LoginRequest;
import com.EEIT25.unicloth.dto.LoginResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentMember currentMember;

    @Transactional
    public LoginResponse login(LoginRequest request){
        Member member = memberRepository.findByEmail(request.email())
                .orElseThrow(()-> ApiException.notFound("帳號或密碼錯誤"));
        if(!passwordEncoder.matches(request.password(), member.getPasswordHash())){
            throw ApiException.unauthorized("帳號或密碼錯誤");
        }

        return new LoginResponse(member.getId(),currentMember.getCurrentToken());
    }



}
