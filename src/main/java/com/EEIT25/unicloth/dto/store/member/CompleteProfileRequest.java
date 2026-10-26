package com.EEIT25.unicloth.dto.store.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * 第一次用 Google 登入後補填的個人資料
 *
 * @param name     姓名
 * @param phone    手機
 * @param gender   性別：male / female
 * @param birthday 生日
 * @param address  地址（選填）
 */
public record CompleteProfileRequest(
        @NotBlank @Size(max = 50) String name,
        @NotBlank @Size(max = 20) String phone,
        @NotBlank @Pattern(regexp = "male|female", message = "只能是 male 或 female") String gender,
        @NotNull @Past LocalDate birthday,
        @Size(max = 255) String address
) {
}
