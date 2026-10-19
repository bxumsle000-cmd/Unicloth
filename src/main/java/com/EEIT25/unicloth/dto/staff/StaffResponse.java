package com.EEIT25.unicloth.dto.staff;

import com.EEIT25.unicloth.enums.Department;
import com.EEIT25.unicloth.enums.StaffStatus;

import java.time.LocalDateTime;

public record StaffResponse(
        String account,
        String name,
        Department department,
        StaffStatus status,
        LocalDateTime lastLoginAt
) {
}
