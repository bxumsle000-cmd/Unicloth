package com.EEIT25.unicloth.dto;

import java.time.LocalDate;

public record UpdateMemberRequest(
        String name,
        String phone,
        String address
) {
}
