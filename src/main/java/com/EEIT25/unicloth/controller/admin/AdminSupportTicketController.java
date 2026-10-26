package com.EEIT25.unicloth.controller.admin;

import com.EEIT25.unicloth.dto.admin.cs.AdminSupportTicketDetailResponse;
import com.EEIT25.unicloth.dto.admin.cs.AdminSupportTicketListResponse;
import com.EEIT25.unicloth.dto.admin.cs.ReplySupportTicketRequest;
import com.EEIT25.unicloth.enums.supportTicket.TicketStatus;
import com.EEIT25.unicloth.service.admin.AdminSupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 客服部門後台的客服單 API。
 *
 * 會員端建立客服單使用 /api/support-tickets；
 * 客服人員處理案件則統一使用這個 /api/admin/cs/tickets 路徑。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/cs/tickets")
public class AdminSupportTicketController {
    private final AdminSupportTicketService adminSupportTicketService;

    /**
     * 取得可搜尋、篩選、分頁的客服單清單。
     *
     * page 從 0 開始；預設每頁 20 筆，最新送出的客服單排最前面。
     */
    @GetMapping
    public Page<AdminSupportTicketListResponse> getTickets(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) TicketStatus status,
            @ParameterObject
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return adminSupportTicketService.getTickets(
                keyword,
                status,
                pageable
        );
    }

    /**
     * 取得單筆客服單完整內容與既有客服回覆。
     */
    @GetMapping("/{ticketId}")
    public AdminSupportTicketDetailResponse getTicket(
            @PathVariable Long ticketId
    ) {
        return adminSupportTicketService.getTicket(ticketId);
    }

    /**
     * 儲存客服回覆，並依 resolve 決定案件保持處理中或直接結案。
     */
    @PatchMapping("/{ticketId}/reply")
    public AdminSupportTicketDetailResponse replyTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody ReplySupportTicketRequest request
    ) {
        return adminSupportTicketService.replyTicket(
                ticketId,
                request
        );
    }
}