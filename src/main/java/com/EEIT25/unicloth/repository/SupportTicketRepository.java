package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.SupportTicket;
import com.EEIT25.unicloth.enums.supportTicket.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    // 用客服單號查（例如 CS12345678）
    Optional<SupportTicket> findByTicketNo(String ticketNo);

    // 產生單號時檢查是否撞號
    boolean existsByTicketNo(String ticketNo);

    // 會員查自己送出的客服單
    List<SupportTicket> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    // 後台依狀態篩選（IN_PROGRESS / RESOLVED）
    List<SupportTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status);

    // 後台全部列表，最新的在前
    List<SupportTicket> findAllByOrderByCreatedAtDesc();

    /**
     * 客服後台清單查詢。
     *
     * keyword 可搜尋客服單號、會員 Email、問題類型與問題內容；
     * status 未指定時查詢全部狀態，Pageable 則負責分頁與排序。
     */
    @Query("""
            SELECT ticket
            FROM SupportTicket ticket
            WHERE (
                :keyword = ''
                OR LOWER(ticket.ticketNo) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(ticket.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(ticket.topic) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(ticket.message) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            AND (:status IS NULL OR ticket.status = :status)
            """)
    Page<SupportTicket> findByAdminFilter(
            @Param("keyword") String keyword,
            @Param("status") TicketStatus status,
            Pageable pageable
    );
}