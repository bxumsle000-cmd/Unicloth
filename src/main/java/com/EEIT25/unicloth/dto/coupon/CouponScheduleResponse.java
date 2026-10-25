package com.EEIT25.unicloth.dto.coupon;

import com.EEIT25.unicloth.entity.CouponSchedule;
import com.EEIT25.unicloth.enums.CouponScheduleStatus;

import java.time.LocalDateTime;

/**
 * 行銷後台「預約發送紀錄」的一筆預約
 *
 * @param id            預約 id（CouponSchedule.id）；取消預約用它指定
 * @param couponCode    要發的券的折扣碼
 * @param couponTitle   要發的券的名稱
 * @param targetAll     true = 全部會員（以發送當下的會員為準）
 * @param memberCount   指定會員時選了幾位；全部會員時是 0
 * @param scheduledAt   預約時間
 * @param status        PENDING / SENT / FAILED / CANCELLED
 * @param sentAt        實際發出的時間；還沒發是 null
 * @param sentCount     實際發了幾位；還沒發是 null
 * @param createdByName 建立預約的員工姓名
 */
public record CouponScheduleResponse(
        Long id,
        String couponCode,
        String couponTitle,
        boolean targetAll,
        int memberCount,
        LocalDateTime scheduledAt,
        CouponScheduleStatus status,
        LocalDateTime sentAt,
        Integer sentCount,
        String createdByName
) {

    /**
     * @param schedule 預約（要在 @Transactional 裡呼叫，coupon、members、createdBy 才能 lazy 載入）
     */
    public static CouponScheduleResponse from(CouponSchedule schedule){
        return new CouponScheduleResponse(
                schedule.getId(),
                schedule.getCoupon().getCode(),
                schedule.getCoupon().getTitle(),
                schedule.isTargetAll(),
                schedule.getMembers().size(),
                schedule.getScheduledAt(),
                schedule.getStatus(),
                schedule.getSentAt(),
                schedule.getSentCount(),
                schedule.getCreatedBy().getName());
    }
}
