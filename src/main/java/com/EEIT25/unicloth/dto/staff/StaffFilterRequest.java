package com.EEIT25.unicloth.dto.staff;

import com.EEIT25.unicloth.enums.Department;
import com.EEIT25.unicloth.enums.StaffStatus;

public record StaffFilterRequest(
        String keyword,
        Department department,
        StaffStatus status
) {

}
