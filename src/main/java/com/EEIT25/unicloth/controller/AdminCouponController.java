package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.coupon.AdminCouponResponse;
import com.EEIT25.unicloth.dto.coupon.CreateCouponRequest;
import com.EEIT25.unicloth.dto.coupon.UpdateCouponRequest;
import com.EEIT25.unicloth.service.CouponService;
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
    private final CouponService couponService;

    /** 折價券列表（含停用的），篩選在前端做 */
    @GetMapping
    public List<AdminCouponResponse> getAllCoupons() {
        return couponService.getAllCoupons();
    }

    /** 新增折價券，預設啟用 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        couponService.createCoupon(request);
    }

    /** 編輯折價券（折扣碼不能改），整張表單一起送 */
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void editCoupon(@PathVariable Long id, @Valid @RequestBody UpdateCouponRequest request) {
        couponService.editCoupon(id, request);
    }

    /** 啟用折價券 */
    @PatchMapping("/{id}/enable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void enable(@PathVariable Long id) {
        couponService.changeActive(id, true);
    }

    /** 停用折價券：之後不能再發，已發出的券會員還是能用 */
    @PatchMapping("/{id}/disable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable(@PathVariable Long id) {
        couponService.changeActive(id, false);
    }
}
