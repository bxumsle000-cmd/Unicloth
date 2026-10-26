package com.EEIT25.unicloth.dto.coupon;

import com.EEIT25.unicloth.enums.CouponAutoTrigger;
import com.EEIT25.unicloth.enums.CouponType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 行銷後台新增折價券（啟用狀態不用傳，新增的券預設啟用）<br>
 * 要看兩個欄位才能判斷的規則（打折 % 上限、折的金額要比最低消費小）在 Service 檢查
 *
 * @param code        折扣碼，例如 WELCOME100；只能英文和數字，存的時候轉大寫，建立後不能改，長度上限跟 coupons.code 一樣是 30
 * @param title       券名稱，例如 新會員 100 元折價券，長度上限跟 coupons.title 一樣是 100
 * @param type        AMOUNT / PERCENT（沒有免運券）
 * @param value       AMOUNT → 折多少元；PERCENT → 折幾 %（10 = 9 折）
 * @param minSubtotal 最低消費
 * @param validDays   領取後幾天內有效
 * @param autoTrigger 自動發送時機，例如 BIRTHDAY；null = 只能手動發
 */
public record CreateCouponRequest(
        @NotBlank(message = "請輸入折扣碼") String code,
        @NotBlank(message = "請輸入名稱") String title,
        @NotNull(message = "請選擇折扣方式") CouponType type,
        @NotNull(message = "請輸入折扣") @Min(value = 1, message = "折扣要大於 0") Integer value,
        @NotNull(message = "請輸入最低消費") @Min(value = 0, message = "最低消費不能是負的") Integer minSubtotal,
        @NotNull(message = "請輸入有效天數") @Min(value = 1, message = "有效天數至少 1 天") Integer validDays,
        CouponAutoTrigger autoTrigger
) {
}
