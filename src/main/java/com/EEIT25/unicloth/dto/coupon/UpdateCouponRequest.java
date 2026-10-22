package com.EEIT25.unicloth.dto.coupon;

import com.EEIT25.unicloth.enums.CouponAutoTrigger;
import com.EEIT25.unicloth.enums.CouponType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 行銷後台編輯折價券（折扣碼建立後不能改，所以沒有 code；啟用 / 停用另外一支）<br>
 * 已發出、還沒用的券也會跟著變，因為會員持有的券（MemberCoupon）是看 Coupon 的折扣內容
 *
 * @param title       券名稱，例如 新會員 100 元折價券，長度上限跟 coupons.title 一樣是 100
 * @param type        AMOUNT / PERCENT（沒有免運券）
 * @param value       AMOUNT → 折多少元；PERCENT → 折幾 %（10 = 9 折）
 * @param minSubtotal 最低消費
 * @param validDays   領取後幾天內有效；只影響之後發的券，已發出的券到期時間不變
 * @param autoTrigger 自動發送時機，例如 SIGNUP；null = 只能手動發
 */
public record UpdateCouponRequest(
        @NotBlank(message = "請輸入名稱")
        @Size(max = 100, message = "名稱最多 100 個字")
        String title,

        @NotNull(message = "請選擇折扣方式") CouponType type,
        @NotNull(message = "請輸入折扣") @Min(value = 1, message = "折扣要大於 0") Integer value,
        @NotNull(message = "請輸入最低消費") @Min(value = 0, message = "最低消費不能是負的") Integer minSubtotal,
        @NotNull(message = "請輸入有效天數") @Min(value = 1, message = "有效天數至少 1 天") Integer validDays,
        CouponAutoTrigger autoTrigger
) {
}
