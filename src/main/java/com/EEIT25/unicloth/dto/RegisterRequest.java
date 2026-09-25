package com.EEIT25.unicloth.dto;

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
        String email,
        String password,
        String name,
        String phone,
        String gender,
        LocalDate birthday,
        String address
) {
}
