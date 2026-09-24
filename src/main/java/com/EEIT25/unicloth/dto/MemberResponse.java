package com.EEIT25.unicloth.dto;

import com.EEIT25.unicloth.entity.Member;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

public record MemberResponse(
        Long memberId ,
        String email,
        String name,
        String phone,
        String gender,
        LocalDate birthday,
        String status,
        LocalDateTime createAt
) {
    public static MemberResponse from(Member member){
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getName(),
                member.getPhone(),
                member.getGender(),
                member.getBirthday(),
                member.getStatus(),
                member.getCreatedAt());
    }
}
