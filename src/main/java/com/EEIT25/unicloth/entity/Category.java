package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 分類（主 / 副分類合併，用 parent 分層）
 * parent == null 代表主分類；有值代表副分類，指向所屬主分類。
 */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 自我參照：副分類指向主分類
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @Column(nullable = false)
    private String name;

    // 固定代碼（Uniqlo 分類代碼，例如 all_men-tops-t-shirts），前端與網址用它，不用 id
    @Column(length = 100)
    private String code;

    // 分類小圖示相對路徑，例如 img/categories/icon-all_men-outer.jpg；目前只有第 2 層有，其他是 null
    // 叫 iconUrl 不叫 imageUrl，是為了跟 Product.imageUrl（商品主圖）區分
    @Column(name = "icon_url", length = 500)
    private String iconUrl;
}
