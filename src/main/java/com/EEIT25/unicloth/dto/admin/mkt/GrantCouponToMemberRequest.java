package com.EEIT25.unicloth.dto.admin.mkt;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 行銷人員指定發放一張折價券給會員。
 *
 * 使用會員 Email 查找帳號，前端不必知道資料庫 memberId；
 * couponId 則是行銷後台清單中的 Coupon.id。
 */
public record GrantCouponToMemberRequest(
        @NotBlank(message = "請填寫會員 Email")
        @Email(message = "會員 Email 格式不正確")
        @Size(max = 255, message = "會員 Email 不得超過 255 個字")
        String memberEmail,

        @NotNull(message = "請選擇要發放的折價券")
        Long couponId
) {
}