package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 訂單明細（快照）
 * 商品名稱、顏色、尺寸、單價都在下單當下複製一份存起來，
 * 之後商品改名或改價，歷史訂單不會跟著變。
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // 反查用；商品刪除時資料庫會設成 null，明細照樣保留
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private String color;

    @Column(nullable = false)
    private String size;

    @Column(name = "image_url")
    private String imageUrl;

    // 下單當時單價
    @Column(name = "unit_price", nullable = false)
    private Integer unitPrice;

    @Column(nullable = false)
    private Integer qty;

    // unitPrice × qty
    @Column(name = "line_total", nullable = false)
    private Integer lineTotal;
}
