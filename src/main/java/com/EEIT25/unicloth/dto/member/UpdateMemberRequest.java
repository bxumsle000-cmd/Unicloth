package com.EEIT25.unicloth.dto.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @param name    姓名
 * @param phone   手機
 * @param address 地址
 */
public record UpdateMemberRequest(
        @NotBlank @Size(max = 50) String name,
        @NotBlank @Size(max = 20) String phone,
        @Size(max = 255) String address
) {
}
