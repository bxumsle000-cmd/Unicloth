package com.EEIT25.unicloth.dto.checkout;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 結帳（把目前購物車的內容下單）
 *
 * @param receiverName    收件人
 * @param receiverPhone   收件人手機
 * @param receiverEmail   收件人 Email（訂單通知用）
 * @param shippingMethod  home（宅配）/ cvs（超商取貨）
 * @param shippingAddress 宅配地址或超商門市名
 * @param paymentMethod   credit / atm / cod
 * @param note            備註，可不填
 * @param memberCouponId  要使用的折價券（UsableCouponResponse 的 id）；不用券就傳 null
 * @param cartItemIdList  購物車裡勾選要買的項目（CartItemResponse 的 id）；沒勾的會留在購物車
 */
public record CheckoutRequest(
        @NotBlank @Size(max = 50) String receiverName,
        @NotBlank @Size(max = 20) String receiverPhone,
        @Email @Size(max = 255) String receiverEmail,
        @NotBlank @Pattern(regexp = "home|cvs", message = "只能是 home 或 cvs") String shippingMethod,
        @NotBlank @Size(max = 255) String shippingAddress,
        @NotBlank @Pattern(regexp = "credit|atm|cod", message = "只能是 credit、atm 或 cod") String paymentMethod,
        @Size(max = 255) String note,
        Long memberCouponId,
        @NotEmpty(message = "請至少勾選一件商品") List<Long> cartItemIdList
) {
}
