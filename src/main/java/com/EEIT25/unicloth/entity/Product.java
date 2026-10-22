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
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * 商品
 */
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

    // 網址用的字串 id，例如 women-487396
    @Column(nullable = false, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // 商品可擁有多個風格標籤
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "product_styles",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "style_id")
    )
    @Builder.Default
    private Set<Style> styles = new HashSet<>();

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    // 售價
    @Column(nullable = false)
    private Integer price;

    // 原價；有值且 > price 就顯示特價
    @Column(name = "orig_price")
    private Integer origPrice;

    // 新品標籤（欄位叫 newArrival 是為了避開 Lombok 對 isXxx 布林欄位的奇怪命名）
    @Column(name = "is_new", nullable = false)
    private boolean newArrival;

    // 首頁熱門
    @Column(name = "is_hot", nullable = false)
    private boolean hot;

    // 主圖（列表縮圖）；各顏色的圖在 ProductVariant.url
    @Column(name = "image_url")
    private String imageUrl;

    // 存成大寫字串，例如 ON_SALE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProductStatus status = ProductStatus.ON_SALE;

    // 預定自動下架時間；null 代表未排程
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