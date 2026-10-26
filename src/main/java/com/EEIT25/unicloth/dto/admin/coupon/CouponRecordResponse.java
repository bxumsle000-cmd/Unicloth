package com.EEIT25.unicloth.dto.admin.coupon;

import com.EEIT25.unicloth.enums.coupon.CouponSource;
import com.EEIT25.unicloth.enums.coupon.MemberCouponStatus;

import java.time.LocalDateTime;

/**
 * 行銷後台「發券紀錄」的一筆：某位會員拿到的一張券（MemberCoupon），包含手動發的和自動發的
 *
 * @param id            會員持有這張券的 id（MemberCoupon.id）
 * @param receivedAt    發券時間
 * @param memberName    會員姓名（member_profiles.name）；還沒補填會員資料的是 null
 * @param memberEmail   會員登入 email
 * @param couponCode    折扣碼
 * @param couponTitle   券名稱
 * @param source        這張券怎麼來的，例如 MANUAL
 * @param expireAt      到期時間
 * @param status        USABLE（可使用）/ USED（已使用）/ EXPIRED（已過期）
 * @param usedAt        使用時間；還沒用是 null
 * @param orderNo       用在哪張訂單的訂單編號；還沒用是 null
 * @param orderDiscount 那張訂單折了多少元；還沒用是 null
 */
public record CouponRecordResponse(
        Long id,
        LocalDateTime receivedAt,
        String memberName,
        String memberEmail,
        String couponCode,
        String couponTitle,
        CouponSource source,
        LocalDateTime expireAt,
        MemberCouponStatus status,
        LocalDateTime usedAt,
        String orderNo,
        Integer orderDiscount
) {

    /**
     * 給 MemberCouponRepository.findRecords 的 select new 用：status 不用傳，由 usedAt、expireAt 算出來
     */
    public CouponRecordResponse(Long id, LocalDateTime receivedAt, String memberName, String memberEmail,
                                String couponCode, String couponTitle, CouponSource source, LocalDateTime expireAt,
                                LocalDateTime usedAt, String orderNo, Integer orderDiscount) {
        this(id, receivedAt, memberName, memberEmail, couponCode, couponTitle, source, expireAt,
                MemberCouponStatus.of(usedAt, expireAt), usedAt, orderNo, orderDiscount);
    }
}
