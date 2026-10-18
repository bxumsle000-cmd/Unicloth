package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.admin.StaffLoginRequest;
import com.EEIT25.unicloth.dto.admin.StaffLoginResponse;
import com.EEIT25.unicloth.service.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 後台員工登入（跟會員的 /api/auth 分開）
 */
@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {
    private final AdminAuthService adminAuthService;

    /** 員工登入 */
    @PostMapping("/login")
    public StaffLoginResponse login(@Valid @RequestBody StaffLoginRequest request) {
        return adminAuthService.login(request);
    }
}
