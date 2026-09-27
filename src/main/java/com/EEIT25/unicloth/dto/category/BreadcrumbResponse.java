package com.EEIT25.unicloth.dto.category;

import com.EEIT25.unicloth.entity.Category;

/**
 * 麵包屑上的一格
 *
 * @param code 分類代碼，點下去要連到的分類頁
 * @param name 顯示名稱，例如 男裝
 */
public record BreadcrumbResponse(
        String code,
        String name
) {
    public static BreadcrumbResponse from(Category category) {
        return new BreadcrumbResponse(category.getCode(), category.getName());
    }
}
