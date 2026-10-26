package com.EEIT25.unicloth.dto.admin.product;

import com.EEIT25.unicloth.enums.product.InventoryTransactionType;

import java.time.LocalDateTime;
import java.util.List;

public record InventoryTransactionResponse(

        Long id,

        InventoryTransactionType type,

        String note,

        Long staffId,

        String staffName,

        LocalDateTime createdAt,

        List<ItemResponse> items

) {

    public record ItemResponse(

            Long id,

            /**
             * SKU 已刪除時可能是 null。
             */
            Long variantId,

            String skuCode,

            String productName,

            String color,

            String size,

            Integer quantityChange,

            Integer stockBefore,

            Integer stockAfter

    ) {
    }
}