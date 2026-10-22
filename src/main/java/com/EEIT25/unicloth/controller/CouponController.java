package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.coupon.CouponResponse;
import com.EEIT25.unicloth.dto.coupon.UsableCouponResponse;
import com.EEIT25.unicloth.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 會員端的折價券 API。
 *
 * 這裡只允許會員查看自己持有與結帳可用的券；
 * 建立折價券、啟停與指定發券都改由行銷後台 API 處理。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/coupon")
public class CouponController {
    private final CouponService couponService;

    /**
     * 取得目前登入會員持有的所有折價券。
     */
    @GetMapping
    public List<CouponResponse> getMyCoupons() {
        return couponService.getMyCoupons();
    }

    /**
     * 取得目前結帳金額可評估的折價券。
     *
     * 未達最低消費的券也會回傳，
     * 前端可依 meetsMinSubtotal 顯示可否使用。
     */
    @GetMapping("/usable")
    public List<UsableCouponResponse> getUsableCoupons(
            @RequestParam int subtotal
    ) {
        return couponService.getUsableCoupons(subtotal);
    }
}