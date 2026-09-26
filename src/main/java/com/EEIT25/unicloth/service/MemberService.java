package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.member.ChangePasswordRequest;
import com.EEIT25.unicloth.dto.member.MemberResponse;
import com.EEIT25.unicloth.dto.member.UpdateMemberRequest;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 會員相關服務<br>
 * - {@link #getMe()}：取得目前登入會員資料<br>
 * - {@link #updateProfile(UpdateMemberRequest)}：修改會員資料<br>
 * - {@link #changePassword(ChangePasswordRequest)}：修改密碼
 */
@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentMember currentMember;


    @Transactional
    public MemberResponse getMe(){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(()-> ApiException.notFound("登入過期或失效"));
        return MemberResponse.from(member);
    }

    @Transactional
    public MemberResponse updateProfile(UpdateMemberRequest request){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(()-> ApiException.notFound("登入過期或失效"));

        member.setName(request.name());
        member.setPhone(request.phone());
        member.setAddress(request.address());

        return MemberResponse.from(member);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(()-> ApiException.notFound("登入過期或失效"));

        if (!passwordEncoder.matches(request.oldPassword(),member.getPasswordHash())){
            throw ApiException.badRequest("密碼錯誤");
        }

        if (passwordEncoder.matches(request.newPassword(),member.getPasswordHash())){
            throw ApiException.badRequest("新密碼不能與舊密碼相同");
        }

        member.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }
}
