package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.cs.AdminSupportTicketDetailResponse;
import com.EEIT25.unicloth.dto.admin.cs.AdminSupportTicketListResponse;
import com.EEIT25.unicloth.dto.admin.cs.ReplySupportTicketRequest;
import com.EEIT25.unicloth.entity.SupportTicket;
import com.EEIT25.unicloth.enums.TicketStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 客服後台的客服單處理服務。
 *
 * 會員送出客服單仍由 SupportTicketService 負責；
 * 這個類別只處理客服人員查看、回覆與結案的功能。
 */
@Service
@RequiredArgsConstructor
public class AdminSupportTicketService {
    private final SupportTicketRepository supportTicketRepository;

    /**
     * 依關鍵字與狀態取得客服單清單。
     */
    @Transactional(readOnly = true)
    public Page<AdminSupportTicketListResponse> getTickets(
            String keyword,
            TicketStatus status,
            Pageable pageable
    ) {
        String trimmedKeyword = keyword == null ? "" : keyword.trim();

        return supportTicketRepository
                .findByAdminFilter(trimmedKeyword, status, pageable)
                .map(AdminSupportTicketListResponse::from);
    }

    /**
     * 取得單筆客服單的完整問題與目前回覆。
     */
    @Transactional(readOnly = true)
    public AdminSupportTicketDetailResponse getTicket(Long ticketId) {
        return AdminSupportTicketDetailResponse.from(findTicket(ticketId));
    }

    /**
     * 儲存客服回覆。
     *
     * resolve 為 true 時，回覆後立即結案；
     * resolve 為 false 時，案件維持或重新回到處理中。
     */
    @Transactional
    public AdminSupportTicketDetailResponse replyTicket(
            Long ticketId,
            ReplySupportTicketRequest request
    ) {
        SupportTicket ticket = findTicket(ticketId);

        ticket.setReply(request.reply().trim());
        ticket.setRepliedAt(LocalDateTime.now());

        if (request.resolve()) {
            ticket.setStatus(TicketStatus.RESOLVED);
            ticket.setResolvedAt(LocalDateTime.now());
        } else {
            // 已結案案件若需要再次處理，回覆時可重新開啟。
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            ticket.setResolvedAt(null);
        }

        return AdminSupportTicketDetailResponse.from(ticket);
    }

    /**
     * 集中處理找不到客服單的錯誤，避免每個功能重複相同查詢。
     */
    private SupportTicket findTicket(Long ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound(
                        "找不到客服單：" + ticketId
                ));
    }
}