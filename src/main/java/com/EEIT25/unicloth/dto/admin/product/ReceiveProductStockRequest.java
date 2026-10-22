package com.EEIT25.unicloth.dto.admin.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ReceiveProductStockRequest(

        /**
         * 進貨單號或備註，可不填。
         */
        @Size(
                max = 255,
                message = "備註不能超過 255 個字"
        )
        String note,

        /**
         * 這次要入庫的 SKU。
         */
        @NotEmpty(message = "請至少加入一筆進貨商品")
        @Size(
                max = 200,
                message = "一次最多處理 200 筆 SKU"
        )
        List<@Valid ReceiveItem> items

) {

    public record ReceiveItem(

            @NotNull(message = "缺少 SKU ID")
            Long variantId,

            /**
             * 進貨是增加庫存，因此數量必須大於 0。
             */
            @NotNull(message = "請輸入進貨數量")
            @Positive(message = "進貨數量必須大於 0")
            Integer quantity

    ) {
    }
}