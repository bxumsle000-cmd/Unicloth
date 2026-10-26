package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.auth.StaffLoginRequest;
import com.EEIT25.unicloth.dto.admin.auth.StaffLoginResponse;
import com.EEIT25.unicloth.dto.admin.auth.ChangePasswordRequest;
import com.EEIT25.unicloth.entity.Staff;
import com.EEIT25.unicloth.enums.staff.Department;
import com.EEIT25.unicloth.enums.staff.StaffStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.StaffRepository;
import com.EEIT25.unicloth.security.CurrentStaff;
import com.EEIT25.unicloth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 後台員工的認證服務<br>
 * 跟會員的 {@link com.EEIT25.unicloth.service.shop.AuthService AuthService} 分開，員工 token 裡多帶部門，後台路徑用部門擋權限。<br>
 * - {@link #login(StaffLoginRequest)}：員工登入，發員工 JWT<br><br>
 * - {@link #changePassword(ChangePasswordRequest)}：員工改自己的密碼
 */
@Service
@RequiredArgsConstructor
public class AdminAuthService {
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentStaff currentStaff;

    /**
     * 員工登入：檢查帳號密碼 → 帳號是否停用 → 是否屬於選的部門，通過後更新最後登入時間並發員工 JWT。<br>
     * 帳號或密碼錯都回同一句，不透露是哪個錯；密碼對了才說「不屬於這個部門」，避免員工以為是密碼打錯。<br>
     * ADMIN（管理者）例外：選哪個部門都能登入，回傳選的部門讓前端進該部門頁面，但 token 還是 ADMIN，保留所有部門的權限。
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
        if (staff.getDepartment() != Department.ADMIN && staff.getDepartment() != request.department()) {
            throw ApiException.forbidden("此帳號不屬於「" + request.department().getLabel() + "」，請改選其他部門");
        }

        // @Transactional 裡改 Entity 的欄位，交易結束時會自動 UPDATE，不用再呼叫 save
        staff.setLastLoginAt(LocalDateTime.now());

        return new StaffLoginResponse(
                staff.getId(),
                jwtService.generateStaffToken(staff.getId(), staff.getDepartment()),
                staff.getName(),
                request.department(),
                staff.getAccount());
    }

    /**
     * 員工改自己的密碼（每個部門都能用）：舊密碼要對，新密碼不能跟舊的一樣。<br>
     * 改誰的密碼一律從 {@link CurrentStaff} 拿，不讓前端傳帳號，不然就能改到別人的。
     */
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Staff staff = currentStaff.require();

        if (!passwordEncoder.matches(request.oldPassword(), staff.getPasswordHash())) {
            throw ApiException.badRequest("密碼錯誤");
        }
        if (passwordEncoder.matches(request.newPassword(), staff.getPasswordHash())) {
            throw ApiException.badRequest("新密碼不能與舊密碼相同");
        }

        staff.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }
}
