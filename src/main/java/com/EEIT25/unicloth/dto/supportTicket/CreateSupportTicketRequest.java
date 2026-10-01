package com.EEIT25.unicloth.dto.supportTicket;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 送出客服單
 *
 * @param email   聯絡 Email，客服回覆用
 * @param topic   問題類型：訂單與物流 / 退換貨 / 商品諮詢 / 付款與發票 / 折價券與活動 / 會員帳號問題 / 其他
 * @param message 問題內容
 */
public record CreateSupportTicketRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Pattern(regexp = "訂單與物流|退換貨|商品諮詢|付款與發票|折價券與活動|會員帳號問題|其他",
                message = "不是可選的問題類型") String topic,
        @NotBlank @Size(max = 2000) String message
) {
}
