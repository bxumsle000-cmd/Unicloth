package com.EEIT25.unicloth.dto.admin.analytics;

import com.EEIT25.unicloth.enums.product.SalesTrendDirection;

/**
 * 商品本期與上一期的銷售趨勢。
 *
 * @param productId 商品 id
 * @param slug 商品網址代碼
 * @param name 商品名稱
 * @param imageUrl 商品主圖
 * @param currentUnitsSold 本期售出件數
 * @param previousUnitsSold 上一期售出件數
 * @param unitChange 售出件數差異
 * @param changePercent 銷量變化百分比
 * @param currentRevenue 本期銷售金額
 * @param previousRevenue 上一期銷售金額
 * @param trend 趨勢方向
 */
public record ProductSalesTrendResponse(
        Long productId,
        String slug,
        String name,
        String imageUrl,
        Long currentUnitsSold,
        Long previousUnitsSold,
        Long unitChange,
        Double changePercent,
        Long currentRevenue,
        Long previousRevenue,
        SalesTrendDirection trend
) {
}