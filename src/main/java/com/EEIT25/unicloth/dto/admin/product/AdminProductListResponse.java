package com.EEIT25.unicloth.dto.admin.product;

import com.EEIT25.unicloth.enums.product.ProductStatus;

public record AdminProductListResponse(
        Long id,
        String slug,
        String name,
        String categoryName,
        String categoryCode,
        Integer price,
        Integer totalStock,
        ProductStatus status,
        String imageUrl
) {
}