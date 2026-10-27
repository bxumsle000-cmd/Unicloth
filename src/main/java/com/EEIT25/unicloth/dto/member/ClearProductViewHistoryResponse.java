package com.EEIT25.unicloth.dto.member;

/**
 * 清除會員瀏覽紀錄後的結果。
 */
public record ClearProductViewHistoryResponse(
        int deletedCount
) {
}