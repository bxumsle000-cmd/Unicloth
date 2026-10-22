package com.EEIT25.unicloth.dto.admin.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateProductVariantsRequest(

        @NotBlank(message = "請輸入顏色名稱")
        @Size(
                max = 50,
                message = "顏色名稱不能超過 50 個字"
        )
        String color,

        @NotBlank(message = "請輸入顏色代碼")
        @Pattern(
                regexp = "(?i)COL\\d{2}",
                message = "顏色代碼格式必須像 COL09"
        )
        String colorCode,

        @NotBlank(message = "請提供商品圖片")
        String imageUrl,

        @NotEmpty(message = "請至少新增一個尺寸")
        List<@Valid VariantRequest> variants

) {

    public record VariantRequest(

            @NotBlank(message = "請輸入尺寸")
            @Size(
                    max = 20,
                    message = "尺寸不能超過 20 個字"
            )
            String size,

            @NotNull(message = "請輸入庫存數量")
            @Min(
                    value = 0,
                    message = "庫存不能小於 0"
            )
            Integer stock

    ) {
    }
}