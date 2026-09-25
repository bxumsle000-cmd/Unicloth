package com.EEIT25.unicloth.dto;

import java.time.LocalDate;

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
