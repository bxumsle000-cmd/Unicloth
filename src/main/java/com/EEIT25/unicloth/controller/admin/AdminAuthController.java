package com.EEIT25.unicloth.controller.admin;

import com.EEIT25.unicloth.dto.admin.auth.StaffLoginRequest;
import com.EEIT25.unicloth.dto.admin.auth.StaffLoginResponse;
import com.EEIT25.unicloth.dto.admin.auth.ChangePasswordRequest;
import com.EEIT25.unicloth.service.admin.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 後台員工登入、改自己的密碼（跟會員的 /api/auth 分開）
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

    /** 員工改自己的密碼（每個部門都能用） */
    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        adminAuthService.changePassword(request);
    }
}
