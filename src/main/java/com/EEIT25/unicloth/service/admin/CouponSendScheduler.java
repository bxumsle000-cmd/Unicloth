package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.entity.CouponSchedule;
import com.EEIT25.unicloth.enums.CouponScheduleStatus;
import com.EEIT25.unicloth.repository.CouponScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 折價券預約發送的排程。<br>
 * 找出等待中（PENDING）、預約時間已經到了的預約，一筆一筆發出去。
 * 發送的細節（券停用就不發、只發給 ACTIVE 會員）在 {@link AdminCouponService#sendSchedule(Long)}。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CouponSendScheduler {

    private final CouponScheduleRepository couponScheduleRepository;
    private final AdminCouponService adminCouponService;

    /**
     * 每分鐘檢查一次（啟動後等 1 分鐘才第一次執行）。<br>
     * fixedDelay：上一次跑完才開始算 1 分鐘，不會兩次同時跑。
     */
    @Scheduled(initialDelay = 60_000, fixedDelay = 60_000)
    public void sendDueSchedules() {
        List<CouponSchedule> dueScheduleList = couponScheduleRepository
                .findByStatusAndScheduledAtLessThanEqual(CouponScheduleStatus.PENDING, LocalDateTime.now());

        for (CouponSchedule schedule : dueScheduleList) {
            // 每筆預約各自一個交易：一筆失敗不影響其他筆，失敗的維持 PENDING，下一分鐘再試
            try {
                adminCouponService.sendSchedule(schedule.getId());
                log.info("Coupon schedule processed: scheduleId={}", schedule.getId());
            } catch (Exception e) {
                log.warn("Coupon schedule send failed: scheduleId={}, reason={}",
                        schedule.getId(), e.getMessage());
            }
        }
    }
}
