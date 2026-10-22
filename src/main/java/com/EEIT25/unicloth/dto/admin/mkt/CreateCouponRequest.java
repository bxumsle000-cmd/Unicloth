package com.EEIT25.unicloth.dto.admin.mkt;

import com.EEIT25.unicloth.enums.CouponType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 行銷人員新增折價券範本時送出的資料。
 *
 * code 是會員輸入或系統顯示的優惠代碼；
 * type 與 value 的組合規則會由後端 Service 統一檢查。
 */
public record CreateCouponRequest(
        @NotBlank(message = "請填寫折扣碼")
        @Size(max = 30, message = "折扣碼不得超過 30 個字")
        @Pattern(
                regexp = "[A-Za-z0-9_-]+",
                message = "折扣碼只能使用英文字母、數字、底線或連字號"
        )
        String code,

        @NotBlank(message = "請填寫折價券名稱")
        @Size(max = 100, message = "折價券名稱不得超過 100 個字")
        String title,

        @NotNull(message = "請選擇折價券類型")
        CouponType type,

        @NotNull(message = "請填寫優惠數值")
        @Min(value = 1, message = "優惠數值必須大於 0")
        Integer value,

        @NotNull(message = "請填寫最低消費")
        @Min(value = 0, message = "最低消費不得小於 0")
        Integer minSubtotal,

        @NotNull(message = "請填寫有效天數")
        @Min(value = 1, message = "有效天數至少為 1 天")
        Integer validDays,

        boolean signupGift
) {
}