package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.supportTicket.CreateSupportTicketRequest;
import com.EEIT25.unicloth.dto.supportTicket.SupportTicketResponse;
import com.EEIT25.unicloth.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/support-tickets")
public class SupportTicketController {
    private final SupportTicketService supportTicketService;

    /** 送出客服單，回傳剛建立的客服單（含單號） */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupportTicketResponse create(@Valid @RequestBody CreateSupportTicketRequest request){
        return supportTicketService.create(request);
    }

    /** 我送出的客服單，最新的在前面 */
    @GetMapping
    public List<SupportTicketResponse> getMyTickets(){
        return supportTicketService.getMyTickets();
    }
}
