package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.coupon.AdminCouponResponse;
import com.EEIT25.unicloth.dto.coupon.CouponScheduleResponse;
import com.EEIT25.unicloth.dto.coupon.CreateCouponRequest;
import com.EEIT25.unicloth.dto.coupon.GrantCouponRequest;
import com.EEIT25.unicloth.dto.coupon.UpdateCouponRequest;
import com.EEIT25.unicloth.service.admin.AdminCouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 行銷後台的折價券管理（只有 MKT、ADMIN 能用，SecurityConfig 擋 /api/admin/mkt/**）<br>
 * 要操作哪張券都用網址上的 id 指定
 */
@RestController
@RequestMapping("/api/admin/mkt/coupons")
@RequiredArgsConstructor
public class AdminCouponController {
    private final AdminCouponService adminCouponService;

    /** 折價券列表（含停用的），篩選在前端做 */
    @GetMapping
    public List<AdminCouponResponse> getAllCoupons() {
        return adminCouponService.getAllCoupons();
    }

    /** 新增折價券，預設啟用 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        adminCouponService.createCoupon(request);
    }

    /** 編輯折價券（折扣碼不能改），整張表單一起送 */
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void editCoupon(@PathVariable Long id, @Valid @RequestBody UpdateCouponRequest request) {
        adminCouponService.editCoupon(id, request);
    }

    /** 啟用折價券 */
    @PatchMapping("/{id}/enable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void enable(@PathVariable Long id) {
        adminCouponService.changeActive(id, true);
    }

    /** 停用折價券：之後不能再發，已發出的券會員還是能用 */
    @PatchMapping("/{id}/disable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable(@PathVariable Long id) {
        adminCouponService.changeActive(id, false);
    }

    /** 發券給會員：全部或指定會員，scheduledAt 沒填就立即發送，有填就預約 */
    @PostMapping("/{id}/grant")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void grantTo(@PathVariable Long id, @RequestBody GrantCouponRequest request) {
        adminCouponService.grantTo(id, request);
    }

    /** 預約發送紀錄（含已發送、已取消的），篩選在前端做 */
    @GetMapping("/schedules")
    public List<CouponScheduleResponse> getAllSchedules() {
        return adminCouponService.getAllSchedules();
    }
    /** 取消預約發送（只有還沒發送的能取消） */
    @PatchMapping("/schedules/{scheduleId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelSchedule(@PathVariable Long scheduleId) {
        adminCouponService.cancelSchedule(scheduleId);
    }
}
