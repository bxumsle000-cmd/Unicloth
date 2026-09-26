package com.EEIT25.unicloth.dto;

import java.util.List;

/**
 * 分類頁上方要顯示的資訊
 *
 * @param code       分類代碼
 * @param name       顯示名稱
 * @param breadcrumb 麵包屑，從第一層排到自己，例如 [男裝, T恤/背心]
 * @param children   下一層分類（第 2 層分類頁 → 第 3 層的篩選按鈕）
 */
public record CategoryDetailResponse(
        String code,
        String name,
        List<CategoryResponse> breadcrumb,
        List<CategoryResponse> children
) {
}
