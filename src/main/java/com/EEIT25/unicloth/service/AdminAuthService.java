package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.admin.StaffLoginRequest;
import com.EEIT25.unicloth.dto.admin.StaffLoginResponse;
import com.EEIT25.unicloth.entity.Staff;
import com.EEIT25.unicloth.enums.StaffStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.StaffRepository;
import com.EEIT25.unicloth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 後台員工的認證服務（跟會員的 {@link AuthService} 分開）
 */
@Service
@RequiredArgsConstructor
public class AdminAuthService {
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * 員工登入：檢查帳號密碼 → 帳號是否停用 → 是否屬於選的部門，通過後更新最後登入時間並發員工 JWT。
     * 帳號或密碼錯都回同一句，不透露是哪個錯；密碼對了才說「不屬於這個部門」，避免員工以為是密碼打錯。
     */
    @Transactional
    public StaffLoginResponse login(StaffLoginRequest request) {
        Staff staff = staffRepository.findByAccount(request.account())
                .orElseThrow(() -> ApiException.unauthorized("帳號或密碼錯誤"));
        if (!passwordEncoder.matches(request.password(), staff.getPasswordHash())) {
            throw ApiException.unauthorized("帳號或密碼錯誤");
        }
        if (staff.getStatus() != StaffStatus.ACTIVE) {
            throw ApiException.forbidden("此帳號已被停用");
        }
        if (staff.getDepartment() != request.department()) {
            throw ApiException.forbidden("此帳號不屬於「" + request.department().getLabel() + "」，請改選其他部門");
        }

        // @Transactional 裡改 Entity 的欄位，交易結束時會自動 UPDATE，不用再呼叫 save
        staff.setLastLoginAt(LocalDateTime.now());

        return new StaffLoginResponse(
                staff.getId(),
                jwtService.generateStaffToken(staff.getId(), staff.getDepartment()),
                staff.getName(),
                staff.getDepartment());
    }
}
