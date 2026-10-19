package com.EEIT25.unicloth.dto.staff;

/**
 * 新增員工、重設密碼共用：系統產生的臨時密碼
 *
 * @param tempPassword 臨時密碼明碼，只在這一次回傳給管理者，DB 只存雜湊
 */
public record TempPasswordResponse(
        String tempPassword
) {
}
