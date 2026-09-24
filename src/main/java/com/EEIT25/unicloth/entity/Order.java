package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 訂單主檔
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 例如 UC20260901-8842
    @Column(name = "order_no", nullable = false, unique = true)
    private String orderNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // pending / shipped / ... / cancelled
    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";

    @Column(name = "receiver_name", nullable = false)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false)
    private String receiverPhone;

    // home / cvs
    @Column(name = "shipping_method", nullable = false)
    private String shippingMethod;

    // 宅配地址或超商門市名
    @Column(name = "shipping_address", nullable = false)
    private String shippingAddress;

    // credit / atm / cod
    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(nullable = true)
    private String note;

    // 商品小計
    @Column(nullable = false)
    private Integer subtotal;

    // 折價券折抵
    @Column(nullable = false)
    @Builder.Default
    private Integer discount = 0;

    // 運費（滿 1490 免運、否則 50）
    @Column(name = "shipping_fee", nullable = false)
    @Builder.Default
    private Integer shippingFee = 50;

    // 實付 = subtotal - discount + shippingFee
    @Column(nullable = false)
    private Integer total;

    // 用了哪張券
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_coupon_id")
    private MemberCoupon memberCoupon;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

}
