package com.EEIT25.unicloth.dto.admin.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 商品部門按下「確認出貨」時送來的物流資料。
 * 訂單狀態不由前端傳入，後端會在確認資料正確後自行改為 SHIPPED。
 */
public record ShipOrderRequest(
        @NotBlank(message = "請填寫物流商")
        @Size(max = 50, message = "物流商不得超過 50 個字")
        String shippingCarrier,

        @NotBlank(message = "請填寫物流追蹤碼")
        @Size(max = 100, message = "物流追蹤碼不得超過 100 個字")
        String trackingNumber
) {
}