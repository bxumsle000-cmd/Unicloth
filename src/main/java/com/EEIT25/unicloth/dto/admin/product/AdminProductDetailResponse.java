package com.EEIT25.unicloth.dto.admin.product;

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
        List<VariantResponse> variants
) {
    /*
     * 讓原本尚未修改的 AdminProductService
     * 仍可使用舊的參數格式建立回應。
     */
    public AdminProductDetailResponse(
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
            String imageUrl,
            List<VariantResponse> variants
    ) {
        this(
                id,
                slug,
                name,
                description,
                price,
                origPrice,
                categoryId,
                categoryName,
                categoryCode,
                newArrival,
                hot,
                status,
                null,
                imageUrl,
                variants
        );
    }

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