package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.dto.coupon.CouponRecordResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.enums.CouponSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
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

    // 自動發券防重複：某段時間之後，已經用某種方式（例如 BIRTHDAY）領過某張券的會員 id
    @Query("""
            select mc.member.id from MemberCoupon mc
            where mc.coupon.id = :couponId
              and mc.source = :source
              and mc.receivedAt >= :receivedFrom
            """)
    List<Long> findReceivedMemberIds(@Param("couponId") Long couponId,
                                     @Param("source") CouponSource source,
                                     @Param("receivedFrom") LocalDateTime receivedFrom);

    List<MemberCoupon> findByMember(Member member);

    List<MemberCoupon> findByMemberOrderByExpireAtAsc(Member member);

    /**
     * 後台發券紀錄：每張發出去的券一筆，發券時間新的排前面。<br>
     * 每個篩選是 null 就不篩；keyword 要先轉小寫、前後加 %（比對姓名或 email）；
     * status 傳 MemberCouponStatus 的 name()（例如 "USED"），判斷方式跟 MemberCouponStatus.of 一樣；receivedFrom 含、receivedTo 不含。<br>
     * （status 不能直接傳 enum：MemberCouponStatus 不是任何 entity 的欄位，Hibernate 判斷不出參數的型別，查詢會失敗）<br>
     * members 和 member_profiles 沒有 JPA 關聯，所以用 left join ... on 接；沒補填資料的姓名是 null。<br>
     * 每筆的 status 不在這裡算，由 CouponRecordResponse 的建構子用 usedAt、expireAt 算。
     */
    @Query("""
            select new com.EEIT25.unicloth.dto.coupon.CouponRecordResponse(
                mc.id, mc.receivedAt, p.name, m.email, c.code, c.title, mc.source, mc.expireAt,
                mc.usedAt, o.orderNo, o.discount)
            from MemberCoupon mc
            join mc.member m
            join mc.coupon c
            left join MemberProfile p on p.memberId = m.id
            left join mc.order o
            where (:keyword is null or lower(m.email) like :keyword or lower(p.name) like :keyword)
              and (:couponId is null or c.id = :couponId)
              and (:source is null or mc.source = :source)
              and (:status is null
                   or (:status = 'USED' and mc.usedAt is not null)
                   or (:status = 'EXPIRED' and mc.usedAt is null and mc.expireAt < :now)
                   or (:status = 'USABLE' and mc.usedAt is null and mc.expireAt >= :now))
              and (:receivedFrom is null or mc.receivedAt >= :receivedFrom)
              and (:receivedTo is null or mc.receivedAt < :receivedTo)
            order by mc.receivedAt desc, mc.id desc
            """)
    Page<CouponRecordResponse> findRecords(@Param("keyword") String keyword,
                                           @Param("couponId") Long couponId,
                                           @Param("source") CouponSource source,
                                           @Param("status") String status,
                                           @Param("receivedFrom") LocalDateTime receivedFrom,
                                           @Param("receivedTo") LocalDateTime receivedTo,
                                           @Param("now") LocalDateTime now,
                                           Pageable pageable);
}
