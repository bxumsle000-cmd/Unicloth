package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * SKU（顏色 × 尺寸）
 * 資料庫有 UNIQUE(product_id, color, size)，同一件商品的顏色+尺寸組合不可重複。
 */
@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String color;

    @Column(nullable = false)
    private String size;

    // 貨號，例如 487396-COL57-XS
    @Column(name = "sku_code", nullable = false, unique = true)
    private String skuCode;

    // 這個組合的庫存
    @Column(nullable = false)
    private Integer stock = 0;

    // 由 Hibernate 在 insert 時自動填入現在時間
    @CreationTimestamp
    @Column(name = "published_at", nullable = false, updatable = false)
    private LocalDateTime publishedAt;

    // 圖片相對路徑，例如 img/products/women-487396/col57.jpg
    @Column(nullable = false)
    private String url;
}
