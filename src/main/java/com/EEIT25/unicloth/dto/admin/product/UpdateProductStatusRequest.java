package com.EEIT25.unicloth.dto.admin.product;

import com.EEIT25.unicloth.enums.product.ProductStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateProductStatusRequest(

        @NotNull(message = "請選擇商品狀態")
        ProductStatus status

) {
}