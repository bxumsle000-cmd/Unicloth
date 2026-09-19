package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 折價券範本（會員實際持有的券在 MemberCoupon）
 */
@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 例如 WELCOME100，存大寫
    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    // amount / percent / shipping
    @Column(nullable = false)
    private String type;

    // amount → 折多少元；percent → 折幾 %（10 = 9 折）；shipping → 0
    @Column(nullable = false)
    private Integer value = 0;

    // 消費門檻
    @Column(name = "min_subtotal", nullable = false)
    private Integer minSubtotal = 0;

    // 領取後幾天內有效
    @Column(name = "valid_days", nullable = false)
    private Integer validDays = 30;

    // 註冊時自動發放
    @Column(name = "is_signup_gift", nullable = false)
    private boolean signupGift;

    // 可否領取
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
