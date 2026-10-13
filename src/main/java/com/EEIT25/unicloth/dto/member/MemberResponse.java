package com.EEIT25.unicloth.dto.member;

import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberProfile;

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
 * @param status   帳號狀態：ACTIVE / DISABLED
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
    /**
     * @param member  要轉換的會員帳號（不會帶出密碼）
     * @param profile 這個會員的個人資料
     */
    public static MemberResponse from(Member member, MemberProfile profile){
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                profile.getName(),
                profile.getPhone(),
                profile.getGender(),
                profile.getBirthday(),
                profile.getAddress(),
                member.getStatus().name(),
                member.getCreatedAt());
    }
}
