package com.EEIT25.unicloth.dto.admin.product;

import com.EEIT25.unicloth.enums.product.ProductStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BatchUpdateProductStatusRequest(

        @NotEmpty(message = "請至少選擇一件商品")
        @Size(
                max = 100,
                message = "一次最多處理 100 件商品"
        )
        List<
                @NotNull(message = "商品 ID 不能是空值")
                        Long
                > productIds,

        @NotNull(message = "請選擇商品狀態")
        ProductStatus status

) {
}