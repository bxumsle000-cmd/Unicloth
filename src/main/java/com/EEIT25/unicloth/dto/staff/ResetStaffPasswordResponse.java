package com.EEIT25.unicloth.dto.staff;

/**
 * @param tempPassword 系統產生的臨時密碼，只會在重設這一次顯示給管理者
 */
public record ResetStaffPasswordResponse(
        String tempPassword
) {
}
