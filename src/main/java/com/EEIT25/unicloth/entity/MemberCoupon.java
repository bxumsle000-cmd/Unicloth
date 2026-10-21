package com.EEIT25.unicloth.entity;

import com.EEIT25.unicloth.enums.CouponSource;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 會員持有的折價券
 * 同一張券可以重複領取：每領一次就存一筆（各自有到期日、使用紀錄），不存數量。
 */
@Entity
@Table(name = "member_coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberCoupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    // 領取時算好：now + coupon.validDays
    @Column(name = "expire_at", nullable = false)
    private LocalDateTime expireAt;

    // null = 未使用
    @Column(name = "used_at")
    private LocalDateTime usedAt;

    // 用在哪張訂單（未使用時為 null）
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    // 這張券怎麼來的，存成大寫字串，例如 MANUAL
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CouponSource source = CouponSource.MANUAL;

    @CreationTimestamp
    @Column(name = "received_at", nullable = false, updatable = false)
    private LocalDateTime receivedAt;
}
