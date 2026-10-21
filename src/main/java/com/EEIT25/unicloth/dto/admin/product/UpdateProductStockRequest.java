package com.EEIT25.unicloth.dto.admin.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateProductStockRequest(

        @NotEmpty(message = "請提供至少一筆商品規格")
        List<@Valid VariantStockRequest> variants

) {

    public record VariantStockRequest(

            @NotNull(message = "缺少商品規格 ID")
            Long variantId,

            @NotNull(message = "請輸入庫存數量")
            @Min(
                    value = 0,
                    message = "庫存不能小於 0"
            )
            Integer stock

    ) {
    }
}