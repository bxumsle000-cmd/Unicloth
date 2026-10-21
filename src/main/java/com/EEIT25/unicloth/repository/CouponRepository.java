package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Coupon;
import com.EEIT25.unicloth.enums.CouponAutoTrigger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    // 輸入折扣碼領券
    Optional<Coupon> findByCode(String code);

    // 領券頁面：只列出可領取的
    List<Coupon> findByActiveTrue();

    // 某個時機要自動發放的券（例如註冊時：SIGNUP），同一種時機可以有好幾張
    List<Coupon> findByAutoTriggerAndActiveTrue(CouponAutoTrigger autoTrigger);
}
