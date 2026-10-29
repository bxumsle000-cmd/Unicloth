package com.EEIT25.unicloth.dto.store.style;

import com.EEIT25.unicloth.entity.Style;

/**
 * 回傳給前端的風格資料。
 */
public record StyleResponse(
        Long id,
        String code,
        String name
) {
    // 將資料庫 Entity 轉成回傳格式
    public static StyleResponse from(Style style) {
        return new StyleResponse(
                style.getId(),
                style.getCode(),
                style.getName()
        );
    }
}