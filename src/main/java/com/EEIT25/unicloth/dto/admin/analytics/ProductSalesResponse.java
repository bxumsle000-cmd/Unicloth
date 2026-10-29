package com.EEIT25.unicloth.dto.admin.analytics;

/**
 * 指定期間內的商品銷售統計。
 *
 * @param productId 商品 id
 * @param slug 商品網址代碼
 * @param name 商品名稱
 * @param imageUrl 商品主圖
 * @param unitsSold 售出件數
 * @param orderCount 訂單數
 * @param revenue 商品銷售金額
 */
public record ProductSalesResponse(
        Long productId,
        String slug,
        String name,
        String imageUrl,
        Long unitsSold,
        Long orderCount,
        Long revenue
) {
}