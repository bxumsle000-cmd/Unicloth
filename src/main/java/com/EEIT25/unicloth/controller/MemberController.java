package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.member.ChangePasswordRequest;
import com.EEIT25.unicloth.dto.member.MemberResponse;
import com.EEIT25.unicloth.dto.member.UpdateMemberRequest;
import com.EEIT25.unicloth.service.MemberService;
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

    @PutMapping("/me/profile")
    public MemberResponse updateProfile(@RequestBody UpdateMemberRequest request){
        return memberService.updateProfile(request);
    }

    @PatchMapping("/me/password")
    public void changePassword(@RequestBody ChangePasswordRequest request){
        memberService.changePassword(request);
    }
}


