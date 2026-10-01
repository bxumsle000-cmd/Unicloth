package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.supportTicket.CreateSupportTicketRequest;
import com.EEIT25.unicloth.dto.supportTicket.SupportTicketResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.SupportTicket;
import com.EEIT25.unicloth.enums.TicketStatus;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.SupportTicketRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * 客服單的行為測試（連真的資料庫）。
 * 每個測試結束都會 rollback，不會留下資料。<br>
 * CurrentMember 目前寫死 id=1，資料庫不一定有這個會員，所以測試自己建一個臨時會員，
 * 再把 CurrentMember 換成假的（mock），讓它回傳這個會員的 id。
 */
@SpringBootTest
@Transactional
class SupportTicketServiceTest {

    @Autowired SupportTicketService supportTicketService;
    @Autowired SupportTicketRepository supportTicketRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired EntityManager em;

    @MockitoBean CurrentMember currentMember;

    Member member;

    @BeforeEach
    void setUp() {
        member = saveMember("support-test@example.com");
        when(currentMember.getCurrentId()).thenReturn(member.getId());
    }

    private Member saveMember(String email) {
        return memberRepository.save(Member.builder()
                .email(email)
                .passwordHash("x")
                .name("測試會員")
                .phone("0900000000")
                .gender("male")
                .birthday(LocalDate.of(2000, 1, 1))
                .build());
    }

    private CreateSupportTicketRequest request(String message) {
        return new CreateSupportTicketRequest("support-test@example.com", "退換貨", message);
    }

    @Test
    void 送出客服單_單號格式正確且狀態是處理中() {
        SupportTicketResponse response = supportTicketService.create(request("尺寸不合想換貨"));
        em.flush();   // 真的送到資料庫，NOT NULL / UNIQUE 有問題會在這裡爆

        assertTrue(response.ticketNo().matches("CS\\d{8}"), "單號格式錯誤：" + response.ticketNo());
        assertEquals("IN_PROGRESS", response.status());

        SupportTicket saved = supportTicketRepository.findByTicketNo(response.ticketNo()).orElseThrow();
        assertEquals(member.getId(), saved.getMember().getId());
        assertEquals(TicketStatus.IN_PROGRESS, saved.getStatus());
        assertEquals("退換貨", saved.getTopic());
    }

    @Test
    void 我的客服單_最新的在前面() {
        SupportTicketResponse first = supportTicketService.create(request("第一張"));
        SupportTicketResponse second = supportTicketService.create(request("第二張"));
        em.flush();

        // created_at 只到秒，同一秒送出的兩張分不出先後，所以手動把第一張改早一點
        em.createNativeQuery("UPDATE support_tickets SET created_at = DATEADD(MINUTE, -1, created_at) WHERE ticket_no = ?1")
                .setParameter(1, first.ticketNo())
                .executeUpdate();
        em.clear();

        List<String> ticketNoList = supportTicketService.getMyTickets().stream()
                .map(SupportTicketResponse::ticketNo)
                .toList();

        assertEquals(List.of(second.ticketNo(), first.ticketNo()), ticketNoList);
    }

    @Test
    void 我的客服單_看不到別人的() {
        supportTicketService.create(request("我的"));

        // 換成另一個會員送一張
        Member other = saveMember("support-other@example.com");
        when(currentMember.getCurrentId()).thenReturn(other.getId());
        SupportTicketResponse othersTicket = supportTicketService.create(request("別人的"));

        // 換回自己
        when(currentMember.getCurrentId()).thenReturn(member.getId());
        List<SupportTicketResponse> myTicketList = supportTicketService.getMyTickets();

        assertEquals(1, myTicketList.size());
        assertNotEquals(othersTicket.ticketNo(), myTicketList.get(0).ticketNo());
    }
}
