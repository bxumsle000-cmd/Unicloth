package com.EEIT25.unicloth.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * @param email    Email
 * @param password 密碼
 * @param name     姓名
 * @param phone    手機
 * @param gender   性別
 * @param birthday 生日
 * @param address  地址
 */
public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "密碼長度最少8字") String password,
        @NotBlank @Size(max = 50) String name,
        @NotBlank @Size(max = 20) String phone,
        @NotBlank String gender,
        @NotNull @Past LocalDate birthday,
        @Size(max = 255) String address
) {
}
