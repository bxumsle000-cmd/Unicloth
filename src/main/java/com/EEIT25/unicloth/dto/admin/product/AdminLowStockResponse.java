package com.EEIT25.unicloth.dto.admin.product;

import java.util.List;

/**
 * 後台庫存警示的一件商品。
 */
public record AdminLowStockResponse(

        Long productId,

        String slug,

        String productName,

        String imageUrl,

        /**
         * 庫存為 0 的 SKU。
         */
        List<VariantResponse> outOfStockVariants,

        /**
         * 庫存大於 0，
         * 但小於或等於警示值的 SKU。
         */
        List<VariantResponse> lowStockVariants

) {

    /**
     * 庫存警示中的單一 SKU。
     */
    public record VariantResponse(

            Long variantId,

            String skuCode,

            String color,

            String size,

            Integer stock

    ) {
    }
}