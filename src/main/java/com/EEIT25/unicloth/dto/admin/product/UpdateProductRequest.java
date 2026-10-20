package com.EEIT25.unicloth.dto.admin.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateProductRequest(

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

        boolean newArrival,

        boolean hot

) {
}