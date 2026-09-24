package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 客服單
 */
@Entity
@Table(name = "support_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 例如 CS12345678
    @Column(name = "ticket_no", nullable = false, unique = true)
    private String ticketNo;

    // 未登入也能送，所以可為 null
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(nullable = false)
    private String email;

    // 訂單與物流 / 退換貨 / 商品諮詢 / 付款與發票 / 折價券與活動 / 會員帳號問題 / 其他
    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private String message;

    // IN_PROGRESS / PENDING / RESOLVED
    @Column(nullable = false)
    @Builder.Default
    private String status = "IN_PROGRESS";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
