package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.supportTicket.CreateSupportTicketRequest;
import com.EEIT25.unicloth.dto.supportTicket.SupportTicketResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.SupportTicket;
import com.EEIT25.unicloth.repository.SupportTicketRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 客服單服務<br>
 * - {@link #create(CreateSupportTicketRequest)}：送出客服單<br>
 * - {@link #getMyTickets()}：我送出的客服單
 * <p>
 * TODO 未登入送客服單：support_tickets.member_id 允許 NULL，原本設計是「未登入也能送」。
 * 目前 CurrentMember 寫死 id = 1，分不出有沒有登入，所以先一律綁定目前的會員；
 * 等真正的登入機制做好後，要改成「未登入時 member 存 null」，Controller 也要開放未登入呼叫。
 */
@Service
@RequiredArgsConstructor
public class SupportTicketService {
    private final SupportTicketRepository supportTicketRepository;
    private final CurrentMember currentMember;

    /** 送出客服單，回傳剛建立的客服單（含單號） */
    @Transactional
    public SupportTicketResponse create(CreateSupportTicketRequest request){
        // TODO 登入機制做好後：未登入時這裡不要丟例外，member 存 null（見類別說明）
        Member member = currentMember.require();

        // 產生客服單號，例如 CS12345678；撞號就重抽
        String ticketNo;
        do {
            ticketNo = "CS" + String.format("%08d", ThreadLocalRandom.current().nextInt(100_000_000));
        } while (supportTicketRepository.existsByTicketNo(ticketNo));

        SupportTicket supportTicket = supportTicketRepository.save(SupportTicket.builder()
                .ticketNo(ticketNo)
                .member(member)
                .email(request.email())
                .topic(request.topic())
                .message(request.message())
                .build());

        return SupportTicketResponse.from(supportTicket);
    }

    /** 我送出的客服單，最新的在前面 */
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> getMyTickets(){
        return supportTicketRepository.findByMemberIdOrderByCreatedAtDesc(currentMember.require().getId())
                .stream()
                .map(supportTicket -> SupportTicketResponse.from(supportTicket))
                .toList();
    }
}
