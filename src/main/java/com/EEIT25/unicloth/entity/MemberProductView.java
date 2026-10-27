package com.EEIT25.unicloth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

/**
 * 會員對商品的累積瀏覽紀錄。
 */
@Entity
@Table(name = "member_product_views")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberProductView {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 瀏覽商品的會員。
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 被瀏覽的商品。
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // 同一會員瀏覽此商品的累積次數。
    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private int viewCount = 1;

    @CreationTimestamp
    @Column(name = "first_viewed_at", nullable = false, updatable = false)
    private LocalDateTime firstViewedAt;

    @UpdateTimestamp
    @Column(name = "last_viewed_at", nullable = false)
    private LocalDateTime lastViewedAt;
}