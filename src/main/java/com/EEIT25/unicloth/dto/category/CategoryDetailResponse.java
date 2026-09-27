package com.EEIT25.unicloth.dto.category;

import java.util.List;

/**
 * 分類頁上方要顯示的資訊
 *
 * @param code       分類代碼
 * @param name       顯示名稱
 * @param children   下一層分類（第 2 層分類頁 → 第 3 層的篩選按鈕）
 */
public record CategoryDetailResponse(
        String code,
        String name,
        List<CategoryResponse> children
) {
}
