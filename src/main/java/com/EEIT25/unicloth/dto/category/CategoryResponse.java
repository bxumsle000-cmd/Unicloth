package com.EEIT25.unicloth.dto.category;

import com.EEIT25.unicloth.entity.Category;

import java.util.List;

/**
 * 分類（可帶子分類）
 *
 * @param code     分類代碼，例如 all_men-tops-t-shirts（前端與網址用這個，不用 id）
 * @param name     顯示名稱，例如 T恤/背心
 * @param iconUrl  分類小圖示，例如 img/categories/icon-all_men-outer.jpg；目前只有第 2 層有，其他是 null
 * @param children 子分類；不需要時是空陣列
 */
public record CategoryResponse(
        String code,
        String name,
        String iconUrl,
        List<CategoryResponse> children
) {
    /**
     * 不帶子分類
     *
     * @param category 要轉換的分類
     */
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getCode(), category.getName(), category.getIconUrl(), List.of());
    }

    /**
     * 帶子分類
     *
     * @param category 要轉換的分類
     * @param children 已經轉好的子分類（呼叫端自己查、自己轉）
     */
    public static CategoryResponse from(Category category, List<CategoryResponse> children) {
        return new CategoryResponse(category.getCode(), category.getName(), category.getIconUrl(), children);
    }
}
