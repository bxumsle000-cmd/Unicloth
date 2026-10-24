package com.EEIT25.unicloth.dto.coupon;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 行銷後台發券給會員（要發哪張券由網址上的 id 指定）
 *
 * @param targetAll   true = 全部會員（只發給狀態 ACTIVE 的），memberIds 不用填
 * @param memberIds   targetAll = false 時要發給哪些會員，至少一位
 * @param scheduledAt null = 立即發送；有值 = 預約在這個時間發送，要晚於現在
 */
public record GrantCouponRequest(
        boolean targetAll,
        List<Long> memberIds,
        LocalDateTime scheduledAt
) {
}
