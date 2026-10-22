package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    // 輸入折扣碼領券
    Optional<Coupon> findByCode(String code);

    // 領券頁面：只列出可領取的
    List<Coupon> findByActiveTrue();

    // 註冊時自動發放的券
    List<Coupon> findBySignupGiftTrueAndActiveTrue();

    /**
     * 行銷後台折價券清單。
     *
     * keyword 可搜尋折扣碼與券名稱；
     * active 未指定時查全部，Pageable 負責分頁與排序。
     */
    @Query("""
            SELECT coupon
            FROM Coupon coupon
            WHERE (
                :keyword = ''
                OR LOWER(coupon.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(coupon.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            AND (:active IS NULL OR coupon.active = :active)
            """)
    Page<Coupon> findByAdminFilter(
            @Param("keyword") String keyword,
            @Param("active") Boolean active,
            Pageable pageable
    );
}