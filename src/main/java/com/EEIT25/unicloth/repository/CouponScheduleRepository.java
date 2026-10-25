package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.CouponSchedule;
import com.EEIT25.unicloth.enums.CouponScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CouponScheduleRepository extends JpaRepository<CouponSchedule, Long> {

    // 排程用：某個狀態、預約時間已經到了的預約（DB 有 idx_coupon_schedules_status_time）
    List<CouponSchedule> findByStatusAndScheduledAtLessThanEqual(CouponScheduleStatus status, LocalDateTime now);

    // 預約發送紀錄：status 是 null 就查全部狀態；分頁、排序由 Pageable 決定
    @Query("""
            select s from CouponSchedule s
            where (:status is null or s.status = :status)
            """)
    Page<CouponSchedule> findByStatusFilter(@Param("status") CouponScheduleStatus status, Pageable pageable);
}
