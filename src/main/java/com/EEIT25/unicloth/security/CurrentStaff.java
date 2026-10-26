package com.EEIT25.unicloth.security;

import com.EEIT25.unicloth.entity.Staff;
import com.EEIT25.unicloth.enums.staff.StaffStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 「目前登入的員工」：後台的 Service 用它知道現在是誰，用法跟 {@link CurrentMember} 一樣。
 * <p>
 * {@link JwtAuthFilter} 驗證員工 token 成功後，會把 {@link StaffPrincipal} 放進 SecurityContext，這裡再取出來。
 */
@Component
@RequiredArgsConstructor
public class CurrentStaff {
    private final StaffRepository staffRepository;

    /**
     * 取得目前登入員工的 id。
     * 會員 token 的 principal 是 Long，不是 StaffPrincipal，所以會員拿不到員工身分。
     */
    public Long getCurrentId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof StaffPrincipal staff)) {
            throw ApiException.unauthorized("尚未登入或登入已失效");
        }
        return staff.staffId();
    }

    /** 取得目前登入的員工；資料庫查不到代表登入失效，丟 401；帳號被停用丟 403 */
    public Staff require() {
        Staff staff = staffRepository.findById(getCurrentId())
                .orElseThrow(() -> ApiException.unauthorized("登入過期或失效"));

        // token 發出去之後就收不回來，帳號被停用時要在這裡擋，不然舊 token 到過期前都還能用
        if (staff.getStatus() != StaffStatus.ACTIVE) {
            throw ApiException.forbidden("此帳號已被停用");
        }
        return staff;
    }
}
