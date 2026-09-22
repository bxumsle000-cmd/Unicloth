package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    // 輸入折扣碼領券
    Optional<Coupon> findByCode(String code);

    // 領券頁面：只列出可領取的
    List<Coupon> findByActiveTrue();

    // 註冊時自動發放的券
    List<Coupon> findBySignupGiftTrueAndActiveTrue();
}
