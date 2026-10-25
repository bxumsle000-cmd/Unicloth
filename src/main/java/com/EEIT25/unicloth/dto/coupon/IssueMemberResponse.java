package com.EEIT25.unicloth.dto.coupon;

/**
 * 發券時可以選的會員（行銷後台「發券給會員」的會員清單）
 *
 * @param id    會員 id，發券時放進 GrantCouponRequest.memberIds
 * @param name  姓名（member_profiles.name）；還沒補填會員資料的是 null
 * @param email 登入 email
 */
public record IssueMemberResponse(
        Long id,
        String name,
        String email
) {
}
