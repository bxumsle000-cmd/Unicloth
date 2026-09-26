package com.EEIT25.unicloth.dto.member;

/**
 * @param oldPassword 舊密碼
 * @param newPassword 新密碼
 */
public record ChangePasswordRequest(
        String oldPassword,
        String newPassword
) {
}
