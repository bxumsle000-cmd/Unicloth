package com.EEIT25.unicloth.dto;

public record ChangePasswordRequest(
        String oldPassword,
        String newPassword
) {
}
