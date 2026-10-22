package com.EEIT25.unicloth.dto.admin.cs;

import com.EEIT25.unicloth.entity.SupportTicket;

import java.time.LocalDateTime;

/**
 * 客服後台列表中的單筆客服單摘要。
 *
 * 不放問題全文與客服回覆，清單只需要顯示辨識、篩選與處理進度的資料；
 * 點進單筆詳細資料時，才另外取得完整內容。
 */
public record AdminSupportTicketListResponse(
        Long id,
        String ticketNo,
        String email,
        String topic,
        String status,
        LocalDateTime createdAt,
        LocalDateTime repliedAt,
        LocalDateTime resolvedAt
) {
    /**
     * 將資料庫 entity 轉成客服清單回應資料。
     */
    public static AdminSupportTicketListResponse from(
            SupportTicket supportTicket
    ) {
        return new AdminSupportTicketListResponse(
                supportTicket.getId(),
                supportTicket.getTicketNo(),
                supportTicket.getEmail(),
                supportTicket.getTopic(),
                supportTicket.getStatus().name(),
                supportTicket.getCreatedAt(),
                supportTicket.getRepliedAt(),
                supportTicket.getResolvedAt()
        );
    }
}