package com.EEIT25.unicloth.dto.admin.product;

import com.EEIT25.unicloth.dto.store.style.StyleResponse;
import com.EEIT25.unicloth.enums.product.ProductStatus;
import java.time.LocalDateTime;
import java.util.List;

public record AdminProductDetailResponse(
        Long id,
        String slug,
        String name,
        String description,
        Integer price,
        Integer origPrice,
        Long categoryId,
        String categoryName,
        String categoryCode,
        boolean newArrival,
        boolean hot,
        ProductStatus status,
        LocalDateTime scheduledOffAt,
        String imageUrl,
        List<StyleResponse> styles,
        List<VariantResponse> variants
) {
    /**
     * 商品的一個顏色與尺寸組合。
     */
    public record VariantResponse(
            Long id,
            String color,
            String size,
            String skuCode,
            Integer stock,
            String imageUrl
    ) {
    }
}