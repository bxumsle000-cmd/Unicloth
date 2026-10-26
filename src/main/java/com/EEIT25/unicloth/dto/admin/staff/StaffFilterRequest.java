package com.EEIT25.unicloth.dto.admin.staff;

import com.EEIT25.unicloth.enums.staff.Department;
import com.EEIT25.unicloth.enums.staff.StaffStatus;

/**
 * 員工列表的篩選條件（都是選填，沒帶就是不篩）<br>
 * 網址例：?keyword=sys&department=PRODUCT&status=ACTIVE
 *
 * @param keyword    關鍵字，帳號或姓名「包含」就算，不分大小寫
 * @param department 所屬部門
 * @param status     帳號狀態，例如 ACTIVE、DISABLED
 */
public record StaffFilterRequest(
        String keyword,
        Department department,
        StaffStatus status
) {

}
