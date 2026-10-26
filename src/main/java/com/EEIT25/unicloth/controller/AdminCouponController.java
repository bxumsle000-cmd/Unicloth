package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.coupon.AdminCouponResponse;
import com.EEIT25.unicloth.dto.coupon.CouponRecordResponse;
import com.EEIT25.unicloth.dto.coupon.CouponScheduleResponse;
import com.EEIT25.unicloth.dto.coupon.CreateCouponRequest;
import com.EEIT25.unicloth.dto.coupon.GrantCouponRequest;
import com.EEIT25.unicloth.dto.coupon.UpdateCouponRequest;
import com.EEIT25.unicloth.enums.CouponScheduleStatus;
import com.EEIT25.unicloth.enums.CouponSource;
import com.EEIT25.unicloth.enums.MemberCouponStatus;
import com.EEIT25.unicloth.service.admin.AdminCouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    /**
     * 預約發送紀錄（含已發送、已取消的）<br>
     * status 沒傳就查全部狀態；page 從 0 開始，預設每頁 10 筆，預約時間晚的排前面
     */
    @GetMapping("/schedules")
    public Page<CouponScheduleResponse> getSchedules(
            @RequestParam(required = false) CouponScheduleStatus status,
            @ParameterObject @PageableDefault(size = 10, sort = "scheduledAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return adminCouponService.getSchedules(status, pageable);
    }

    /** 取消預約發送（只有還沒發送的能取消） */
    @PatchMapping("/schedules/{scheduleId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelSchedule(@PathVariable Long scheduleId) {
        adminCouponService.cancelSchedule(scheduleId);
    }

    /**
     * 發券紀錄：每張發出去的券一筆（手動發和自動發都有），發券時間新的排前面<br>
     * 篩選都是選填：keyword 比對會員姓名或 email；status 是 USABLE / USED / EXPIRED；
     * receivedFrom、receivedTo 格式 2026-10-01，兩端都含，只傳一邊也可以<br>
     * page 從 0 開始，預設每頁 10 筆；排序寫死在查詢裡，不吃 sort 參數
     */
    @GetMapping("/records")
    public Page<CouponRecordResponse> getRecords(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long couponId,
            @RequestParam(required = false) CouponSource source,
            @RequestParam(required = false) MemberCouponStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate receivedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate receivedTo,
            @ParameterObject @PageableDefault(size = 10) Pageable pageable) {
        return adminCouponService.getRecords(keyword, couponId, source, status, receivedFrom, receivedTo, pageable);
    }
}
