package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

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

    @Column(nullable = false)
    private String name;

    @Column(nullable = true)
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

    // on_sale / off_shelf
    @Column(nullable = false)
    @Builder.Default
    private String status = "on_sale";

}
