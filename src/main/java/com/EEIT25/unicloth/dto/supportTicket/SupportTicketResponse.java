package com.EEIT25.unicloth.dto.supportTicket;

import com.EEIT25.unicloth.entity.SupportTicket;

import java.time.LocalDateTime;

/**
 * 一張客服單
 *
 * @param ticketNo  客服單號，例如 CS12345678
 * @param email     聯絡 Email
 * @param topic     問題類型
 * @param message   問題內容
 * @param status    IN_PROGRESS / RESOLVED
 * @param createdAt 送出時間
 */
public record SupportTicketResponse(
        String ticketNo,
        String email,
        String topic,
        String message,
        String status,
        LocalDateTime createdAt
) {
    /**
     * @param supportTicket 客服單
     */
    public static SupportTicketResponse from(SupportTicket supportTicket){
        return new SupportTicketResponse(
                supportTicket.getTicketNo(),
                supportTicket.getEmail(),
                supportTicket.getTopic(),
                supportTicket.getMessage(),
                supportTicket.getStatus().name(),
                supportTicket.getCreatedAt());
    }
}
