
package com.EEIT25.unicloth.entity;

import com.EEIT25.unicloth.enums.PaymentMethod;
import com.EEIT25.unicloth.enums.PaymentStatus;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 綠界金流付款紀錄
 *
 * 一張訂單可以對應多筆付款紀錄，
 * 每筆付款紀錄代表一次付款嘗試。
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    // 付款紀錄 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 對應 Unicloth 訂單
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // 傳送給綠界的唯一交易編號
    @Column(
        name = "merchant_trade_no",
        nullable = false,
        unique = true,
        length = 20
    )
    private String merchantTradeNo;

    // 綠界回傳的交易編號
    @Column(name = "ecpay_trade_no", length = 30)
    private String ecpayTradeNo;

    // 付款金額
    @Column(nullable = false)
    private Integer amount;

    // CREDIT / ATM
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    // PENDING / PAID / FAILED / CANCELLED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    // 建立付款紀錄的時間
    @CreationTimestamp
    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    // 付款成功的時間
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
