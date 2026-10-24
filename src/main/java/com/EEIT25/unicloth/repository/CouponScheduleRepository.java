package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.CouponSchedule;
import com.EEIT25.unicloth.enums.CouponScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CouponScheduleRepository extends JpaRepository<CouponSchedule, Long> {

    // 排程用：某個狀態、預約時間已經到了的預約（DB 有 idx_coupon_schedules_status_time）
    List<CouponSchedule> findByStatusAndScheduledAtLessThanEqual(CouponScheduleStatus status, LocalDateTime now);
}
