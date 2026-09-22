package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.MemberCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MemberCouponRepository extends JpaRepository<MemberCoupon, Long> {

    // 我的折價券（全部，含已用 / 已過期），連 Coupon 範本一起撈
    @Query("""
            select mc from MemberCoupon mc
            join fetch mc.coupon
            where mc.member.id = :memberId
            order by mc.receivedAt desc
            """)
    List<MemberCoupon> findAllWithCoupon(@Param("memberId") Long memberId);

    // 結帳時可用的券：未使用 且 還沒過期
    @Query("""
            select mc from MemberCoupon mc
            join fetch mc.coupon
            where mc.member.id = :memberId
              and mc.usedAt is null
              and mc.expireAt > :now
            order by mc.expireAt
            """)
    List<MemberCoupon> findUsable(@Param("memberId") Long memberId, @Param("now") LocalDateTime now);

    // 領券前檢查：同一張券每個會員只能領一次
    boolean existsByMemberIdAndCouponId(Long memberId, Long couponId);

    // 結帳套用券時確認這張券真的是該會員的
    Optional<MemberCoupon> findByIdAndMemberId(Long id, Long memberId);
}
