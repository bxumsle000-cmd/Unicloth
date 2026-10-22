package com.EEIT25.unicloth.dto.admin.mkt;

import jakarta.validation.constraints.NotNull;

/**
 * 更新折價券範本是否繼續發放。
 *
 * active 為 false：停止後續領取與人工發券；
 * 已經發給會員的 MemberCoupon 不會被刪除或失效。
 */
public record UpdateCouponActiveRequest(
        @NotNull(message = "請指定是否啟用折價券")
        Boolean active
) {
}