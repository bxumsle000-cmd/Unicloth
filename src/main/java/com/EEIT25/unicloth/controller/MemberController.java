package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.member.CompleteProfileRequest;
import com.EEIT25.unicloth.dto.member.MemberResponse;
import com.EEIT25.unicloth.dto.member.UpdateMemberRequest;
import com.EEIT25.unicloth.service.shop.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/member")
public class MemberController {
    private final MemberService memberService;

    @GetMapping("/me")
    public MemberResponse getMe(){
        return memberService.getMe();
    }

    /** 第一次用 Google 登入後補填個人資料 */
    @PutMapping("/me/complete-profile")
    public MemberResponse completeProfile(@Valid @RequestBody CompleteProfileRequest request){
        return memberService.completeProfile(request);
    }

    @PutMapping("/me/profile")
    public MemberResponse updateProfile(@Valid @RequestBody UpdateMemberRequest request){
        return memberService.updateProfile(request);
    }
}


