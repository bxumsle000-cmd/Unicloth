package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.member.ChangePasswordRequest;
import com.EEIT25.unicloth.dto.member.MemberResponse;
import com.EEIT25.unicloth.dto.member.UpdateMemberRequest;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberProfile;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberProfileRepository;
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
    private final PasswordEncoder passwordEncoder;
    private final CurrentMember currentMember;
    private final MemberProfileRepository memberProfileRepository;


    /** 取得目前登入會員的資料 */
    @Transactional
    public MemberResponse getMe(){
        Member member = currentMember.require();
        MemberProfile profile = memberProfileRepository.findById(member.getId())
                .orElseThrow(() -> ApiException.notFound("尚未填寫會員資料"));

        return MemberResponse.from(member, profile);
    }

    /** 修改會員資料（姓名、電話、地址）；在交易內改 entity，結束時會自動存回資料庫 */
    @Transactional
    public MemberResponse updateProfile(UpdateMemberRequest request){
        Member member = currentMember.require();
        MemberProfile profile = memberProfileRepository.findById(member.getId())
                .orElseThrow(() -> ApiException.notFound("尚未填寫會員資料"));

        profile.setName(request.name());
        profile.setPhone(request.phone());
        profile.setAddress(request.address());

        return MemberResponse.from(member, profile);
    }

    /** 修改密碼：舊密碼要對，新密碼不能跟舊的一樣 */
    @Transactional
    public void changePassword(ChangePasswordRequest request){
        Member member = currentMember.require();

        if (!passwordEncoder.matches(request.oldPassword(),member.getPasswordHash())){
            throw ApiException.badRequest("密碼錯誤");
        }

        if (passwordEncoder.matches(request.newPassword(),member.getPasswordHash())){
            throw ApiException.badRequest("新密碼不能與舊密碼相同");
        }

        member.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }
}
