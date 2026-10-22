package com.EEIT25.unicloth.dto.admin.mkt;

import com.EEIT25.unicloth.entity.MemberCoupon;
import java.time.LocalDateTime;

/**
 * 行銷後台查看單一折價券的發放紀錄。
 *
 * 一筆資料代表會員實際持有的一張 MemberCoupon，
 * 可用來追查發給哪位會員、何時收到、是否已使用。
 */
public record AdminCouponGrantResponse(
        Long memberCouponId,
        String memberEmail,
        String memberName,
        LocalDateTime receivedAt,
        LocalDateTime expireAt,
        LocalDateTime usedAt,
        String orderNo
) {
    /**
     * 姓名存放在 MemberProfile，因此由 Service 查到後傳入。
     */
    public static AdminCouponGrantResponse from(
            MemberCoupon memberCoupon,
            String memberName
    ) {
        return new AdminCouponGrantResponse(
                memberCoupon.getId(),
                memberCoupon.getMember().getEmail(),
                memberName,
                memberCoupon.getReceivedAt(),
                memberCoupon.getExpireAt(),
                memberCoupon.getUsedAt(),
                memberCoupon.getOrder() == null
                        ? null
                        : memberCoupon.getOrder().getOrderNo()
        );
    }
}