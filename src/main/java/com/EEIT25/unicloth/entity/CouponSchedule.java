package com.EEIT25.unicloth.entity;

import com.EEIT25.unicloth.enums.CouponScheduleStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * 預約發送折價券（立即發送不存這裡，直接寫進 MemberCoupon）
 */
@Entity
@Table(name = "coupon_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    // true = 全部會員（以發送當下的會員為準），members 是空的
    @Column(name = "target_all", nullable = false)
    private boolean targetAll;

    // 指定會員時要發給誰（存在 coupon_schedule_members）
    @ManyToMany
    @JoinTable(
            name = "coupon_schedule_members",
            joinColumns = @JoinColumn(name = "schedule_id"),
            inverseJoinColumns = @JoinColumn(name = "member_id")
    )
    @Builder.Default
    private Set<Member> members = new HashSet<>();

    // 預約時間
    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    // 存成大寫字串，例如 PENDING
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CouponScheduleStatus status = CouponScheduleStatus.PENDING;

    // 實際發出的時間（還沒發是 null）
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    // 實際發了幾位（還沒發是 null）
    @Column(name = "sent_count")
    private Integer sentCount;

    // 建立預約的員工
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private Staff createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
