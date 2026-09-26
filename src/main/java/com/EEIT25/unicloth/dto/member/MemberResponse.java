package com.EEIT25.unicloth.dto.member;

import com.EEIT25.unicloth.entity.Member;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * @param memberId 會員 ID
 * @param email    Email
 * @param name     姓名
 * @param phone    手機
 * @param gender   性別
 * @param birthday 生日
 * @param address  地址
 * @param status   帳號狀態
 * @param createdAt 建立時間
 */
public record MemberResponse(
        Long memberId ,
        String email,
        String name,
        String phone,
        String gender,
        LocalDate birthday,
        String address,
        String status,
        LocalDateTime createdAt
) {
    public static MemberResponse from(Member member){
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getName(),
                member.getPhone(),
                member.getGender(),
                member.getBirthday(),
                member.getAddress(),
                member.getStatus(),
                member.getCreatedAt());
    }
}
