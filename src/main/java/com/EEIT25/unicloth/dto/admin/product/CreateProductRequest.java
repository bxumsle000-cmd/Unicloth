package com.EEIT25.unicloth.dto.admin.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateProductRequest(
        @NotBlank(message = "請輸入商品貨號")
        @Pattern(
                regexp = "\\d{6}",
                message = "商品貨號必須是 6 位數字"
        )
        String productNumber,

        @NotBlank(message = "請輸入商品名稱")
        @Size(
                max = 200,
                message = "商品名稱不能超過 200 個字"
        )
        String name,

        String description,

        @NotNull(message = "請輸入售價")
        @Positive(message = "售價必須大於 0")
        Integer price,

        @Positive(message = "原價必須大於 0")
        Integer origPrice,

        @NotNull(message = "請選擇商品分類")
        Long categoryId,

        // 商品選擇的風格標籤 ID
        Set<Long> styleIds,

        boolean newArrival,

        boolean hot
) {
}