package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.LoginRequest;
import com.EEIT25.unicloth.dto.LoginResponse;
import com.EEIT25.unicloth.dto.MemberResponse;
import com.EEIT25.unicloth.dto.RegisterRequest;
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
                .orElseThrow(()-> ApiException.unauthorized("帳號或密碼錯誤"));
        if(!passwordEncoder.matches(request.password(), member.getPasswordHash())){
            throw ApiException.unauthorized("帳號或密碼錯誤");
        }
        if(!"active".equals(member.getStatus())){
            throw ApiException.forbidden("此帳號已被停用");
        }

        return new LoginResponse(member.getId(),currentMember.getCurrentToken());
    }

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
