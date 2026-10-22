package com.EEIT25.unicloth.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 商品風格，例如日系、自然風、簡約。
 */
@Entity
@Table(name = "styles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Style {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 程式使用的固定代碼，例如 japanese
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    // 顯示給使用者看的風格名稱
    @Column(nullable = false, unique = true, length = 50)
    private String name;
}