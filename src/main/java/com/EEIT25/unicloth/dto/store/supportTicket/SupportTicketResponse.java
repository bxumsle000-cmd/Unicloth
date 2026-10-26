package com.EEIT25.unicloth.dto.store.supportTicket;

import com.EEIT25.unicloth.entity.SupportTicket;

import java.time.LocalDateTime;

/**
 * 會員端的一張客服單。
 *
 * 建立客服單與查看「我的客服單」都使用這個格式；
 * 客服回覆欄位讓會員能在前台看到處理結果。
 *
 * @param ticketNo    客服單號，例如 CS12345678
 * @param email       聯絡 Email
 * @param topic       問題類型
 * @param message     會員問題內容
 * @param reply       客服回覆，尚未回覆時為 null
 * @param status      IN_PROGRESS / RESOLVED
 * @param createdAt   送出時間
 * @param repliedAt   最後回覆時間
 * @param resolvedAt  結案時間
 */
public record SupportTicketResponse(
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
     * 將資料庫客服單轉成會員端可閱讀的資料。
     */
    public static SupportTicketResponse from(SupportTicket supportTicket) {
        return new SupportTicketResponse(
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