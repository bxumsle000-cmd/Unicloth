package com.EEIT25.unicloth.entity;

import com.EEIT25.unicloth.enums.ProductStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "orig_price")
    private Integer origPrice;

    @Column(name = "is_new", nullable = false)
    private boolean newArrival;

    @Column(name = "is_hot", nullable = false)
    private boolean hot;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProductStatus status = ProductStatus.ON_SALE;

    @Column(name = "scheduled_off_at")
    private LocalDateTime scheduledOffAt;

    /*
     * 手動或整批下架時，清除舊的預定下架時間。
     * 避免商品日後重新上架後，立刻被過期排程下架。
     */
    public void setStatus(ProductStatus status) {
        this.status = status;

        if (status == ProductStatus.OFF_SHELF) {
            this.scheduledOffAt = null;
        }
    }
}