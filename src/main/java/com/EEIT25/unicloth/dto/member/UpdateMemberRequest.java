package com.EEIT25.unicloth.dto.member;

/**
 * @param name    姓名
 * @param phone   手機
 * @param address 地址
 */
public record UpdateMemberRequest(
        String name,
        String phone,
        String address
) {
}
