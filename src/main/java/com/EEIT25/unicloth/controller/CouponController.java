package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.coupon.CouponResponse;
import com.EEIT25.unicloth.dto.coupon.UsableCouponResponse;
import com.EEIT25.unicloth.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/coupon")
public class CouponController {
    private final CouponService couponService ;

    @GetMapping
    public List<CouponResponse> getMyCoupons(){
        return couponService.getMyCoupons();
    }

    @GetMapping("/usable")
    public List<UsableCouponResponse>  getUsableCoupons(int subtotal){
        return couponService.getUsableCoupons(subtotal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void grantTo(Long memberId, Long couponId){
        couponService.grantTo(memberId,couponId);
    }
}
