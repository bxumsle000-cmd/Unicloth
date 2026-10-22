package com.EEIT25.unicloth.entity;

import com.EEIT25.unicloth.enums.CouponAutoTrigger;
import com.EEIT25.unicloth.enums.CouponType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 折價券範本（會員實際持有的券在 MemberCoupon）
 */
@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    // 存成大寫字串：AMOUNT / PERCENT（沒有免運券）
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponType type;

    // AMOUNT → 折多少元；PERCENT → 折幾 %（10 = 9 折）
    @Column(nullable = false)
    private Integer value;

    // 最低消費
    @Column(name = "min_subtotal", nullable = false)
    private Integer minSubtotal;

    // 領取後幾天內有效
    @Column(name = "valid_days", nullable = false)
    private Integer validDays;

    // 自動發送時機，存成大寫字串，例如 SIGNUP；null = 只能手動發
    @Enumerated(EnumType.STRING)
    @Column(name = "auto_trigger", length = 20)
    private CouponAutoTrigger autoTrigger;

    // 可否領取
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 這種券已經發出去的每一張（行銷後台算已發幾張用）
    @OneToMany(mappedBy = "coupon")
    private List<MemberCoupon> memberCoupons;
}
