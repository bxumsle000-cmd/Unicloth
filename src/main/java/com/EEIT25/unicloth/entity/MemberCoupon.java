package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 會員持有的折價券
 * 資料庫有 UNIQUE(member_id, coupon_id)：同一張券每個會員只能領一次。
 */
@Entity
@Table(name = "member_coupons")
@Getter
@Setter
@NoArgsConstructor
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

    @CreationTimestamp
    @Column(name = "received_at", nullable = false, updatable = false)
    private LocalDateTime receivedAt;
}
