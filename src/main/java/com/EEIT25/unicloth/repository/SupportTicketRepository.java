package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    // 用客服單號查（例如 CS12345678）
    Optional<SupportTicket> findByTicketNo(String ticketNo);

    // 產生單號時檢查是否撞號
    boolean existsByTicketNo(String ticketNo);

    // 會員查自己送出的客服單
    List<SupportTicket> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    // 後台依狀態篩選（IN_PROGRESS / PENDING / RESOLVED）
    List<SupportTicket> findByStatusOrderByCreatedAtDesc(String status);

    // 後台全部列表，最新的在前
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
}
