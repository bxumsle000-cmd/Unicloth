package com.EEIT25.unicloth.dto.admin.cs;

import com.EEIT25.unicloth.entity.SupportTicket;

import java.time.LocalDateTime;

/**
 * 客服後台查看單筆客服單時使用的完整資料。
 *
 * 問題與回覆內容只在詳細視窗回傳，
 * 避免客服單列表載入大量文字，也避免不必要的資料傳輸。
 */
public record AdminSupportTicketDetailResponse(
        Long id,
        String ticketNo,
        String email,
        String topic,
        String message,
        String reply,
        String status,
        LocalDateTime createdAt,
        LocalDateTime repliedAt,
        LocalDateTime resolvedAt
) {
    /**
     * 將資料庫 entity 轉成客服單詳細資料。
     */
    public static AdminSupportTicketDetailResponse from(
            SupportTicket supportTicket
    ) {
        return new AdminSupportTicketDetailResponse(
                supportTicket.getId(),
                supportTicket.getTicketNo(),
                supportTicket.getEmail(),
                supportTicket.getTopic(),
                supportTicket.getMessage(),
                supportTicket.getReply(),
                supportTicket.getStatus().name(),
                supportTicket.getCreatedAt(),
                supportTicket.getRepliedAt(),
                supportTicket.getResolvedAt()
        );
    }
}