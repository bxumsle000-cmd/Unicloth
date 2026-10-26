package com.EEIT25.unicloth.controller.admin;

import com.EEIT25.unicloth.dto.admin.coupon.IssueMemberResponse;
import com.EEIT25.unicloth.service.admin.AdminCouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 行銷後台查會員（只有 MKT、ADMIN 能用，SecurityConfig 擋 /api/admin/mkt/**）<br>
 * 目前只給「發券給會員」選會員用
 */
@RestController
@RequestMapping("/api/admin/mkt/members")
@RequiredArgsConstructor
public class AdminMktMemberController {
    private final AdminCouponService adminCouponService;

    /** 發券時可以選的會員（只有 ACTIVE 的），搜尋在前端做 */
    @GetMapping
    public List<IssueMemberResponse> getIssueMembers() {
        return adminCouponService.getIssueMembers();
    }
}
