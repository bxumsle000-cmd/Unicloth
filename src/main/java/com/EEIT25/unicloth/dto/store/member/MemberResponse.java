package com.EEIT25.unicloth.dto.store.member;

import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberProfile;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * @param memberId         會員 ID
 * @param email            Email
 * @param name             姓名（還沒補填資料時是 null，下同）
 * @param phone            手機
 * @param gender           性別
 * @param birthday         生日
 * @param address          地址
 * @param status           帳號狀態：ACTIVE / DISABLED
 * @param createdAt        建立時間
 * @param profileCompleted 個人資料填了沒；false 時前端要導去補填頁
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
        LocalDateTime createdAt,
        boolean profileCompleted
) {
    /**
     * @param member  要轉換的會員帳號（不會帶出密碼）
     * @param profile 這個會員的個人資料；還沒補填是 null
     */
    public static MemberResponse from(Member member, MemberProfile profile){
        if (profile == null) {
            return new MemberResponse(
                    member.getId(),
                    member.getEmail(),
                    null, null, null, null, null,
                    member.getStatus().name(),
                    member.getCreatedAt(),
                    false);
        }
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                profile.getName(),
                profile.getPhone(),
                profile.getGender(),
                profile.getBirthday(),
                profile.getAddress(),
                member.getStatus().name(),
                member.getCreatedAt(),
                true);
    }
}
