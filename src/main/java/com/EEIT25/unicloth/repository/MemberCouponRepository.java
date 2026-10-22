package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    // 結帳套用券時確認這張券真的是該會員的
    Optional<MemberCoupon> findByIdAndMemberId(Long id, Long memberId);

    /** 還沒用過才標記為已使用；回傳更新了幾筆（0 = 已經被用掉，例如同時有另一筆結帳搶先用了） */
    @Modifying
    @Query("""
            UPDATE MemberCoupon mc SET mc.usedAt = :usedAt, mc.order = :order
            WHERE mc.id = :id AND mc.usedAt IS NULL
            """)
    int markUsed(@Param("id") Long id, @Param("order") Order order, @Param("usedAt") LocalDateTime usedAt);

    List<MemberCoupon> findByMember(Member member);

    List<MemberCoupon> findByMemberOrderByExpireAtAsc(Member member);

    /**
     * 行銷後台查看某張折價券的發放紀錄。
     *
     * 排序不寫在這裡，改由 Controller 的 PageableDefault 統一處理；
     * 否則 SQL Server 會收到重複的 received_at 排序欄位。
     */
    @Query(
            value = """
                    select mc from MemberCoupon mc
                    join fetch mc.member
                    left join fetch mc.order
                    where mc.coupon.id = :couponId
                    """,
            countQuery = """
                    select count(mc) from MemberCoupon mc
                    where mc.coupon.id = :couponId
                    """
    )
    Page<MemberCoupon> findAdminGrantHistory(
            @Param("couponId") Long couponId,
            Pageable pageable
    );
}