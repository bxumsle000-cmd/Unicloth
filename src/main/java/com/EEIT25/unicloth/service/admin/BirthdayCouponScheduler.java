package com.EEIT25.unicloth.service.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 生日禮自動發送的排程。<br>
 * 每天檢查兩次，把生日禮券發給這個月還沒領過的當月壽星，發送的細節（哪些券、哪些會員、防重複）在 {@link AdminCouponService#sendBirthdayCoupons()}。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BirthdayCouponScheduler {

    private final AdminCouponService adminCouponService;

    /**
     * 每天 00:00 和 12:00 各執行一次。<br>
     * cron 六個欄位依序是：秒 分 時 日 月 星期，"0 0 0,12 * * *" = 每天的 0 點和 12 點。<br>
     * 這個月已經領過的會員不會再發，所以重複執行沒關係；伺服器關機錯過的話，下一次執行時會補發。
     */
    @Scheduled(cron = "0 0 0,12 * * *")
    public void sendBirthdayCoupons() {
        try {
            int count = adminCouponService.sendBirthdayCoupons();
            log.info("Birthday coupons sent: count={}", count);
        } catch (Exception e) {
            log.warn("Birthday coupons send failed: reason={}", e.getMessage());
        }
    }
}
