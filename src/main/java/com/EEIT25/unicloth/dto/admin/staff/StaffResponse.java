package com.EEIT25.unicloth.dto.admin.staff;

import com.EEIT25.unicloth.enums.staff.Department;
import com.EEIT25.unicloth.enums.staff.StaffStatus;

import java.time.LocalDateTime;

/**
 * 後台員工列表的一筆員工資料
 *
 * @param account     登入帳號，例如 sys01；後台改姓名、重設密碼、停用都用它指定員工
 * @param name        員工姓名
 * @param department  所屬部門
 * @param status      帳號狀態，例如 ACTIVE、DISABLED
 * @param lastLoginAt 最後登入時間；還沒登入過是 null
 */
public record StaffResponse(
        String account,
        String name,
        Department department,
        StaffStatus status,
        LocalDateTime lastLoginAt
) {
}
