package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.staff.CreateNewStaffRequest;
import com.EEIT25.unicloth.dto.staff.StaffFilterRequest;
import com.EEIT25.unicloth.dto.staff.StaffResponse;
import com.EEIT25.unicloth.entity.Staff;
import com.EEIT25.unicloth.enums.StaffStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.StaffRepository;
import com.EEIT25.unicloth.security.CurrentStaff;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

/**
 * 後台員工管理相關服務（給 ADMIN 用）<br>
 * 帳號建立後不能改，改姓名、重設密碼、停用 / 啟用都用帳號指定員工；員工自己改密碼在 {@link AdminAuthService}。<br>
 * - {@link #getStaff(StaffFilterRequest, Pageable)}：員工列表，可篩選關鍵字 / 部門 / 狀態，分頁<br><br>
 * - {@link #createNewStaff(CreateNewStaffRequest)}：新增員工，回傳臨時密碼<br><br>
 * - {@link #changeName(String, String)}：改員工姓名<br><br>
 * - {@link #resetPassword(String)}：員工忘記密碼時重設，回傳臨時密碼<br><br>
 * - {@link #disable(String)}：停用員工帳號<br><br>
 * - {@link #enable(String)}：重新啟用員工帳號
 */
@Service
@RequiredArgsConstructor
public class StaffService {
    private final PasswordEncoder passwordEncoder;
    private final CurrentStaff currentStaff;
    private final StaffRepository staffRepository;

    /** 員工列表：依篩選條件查詢並分頁，條件都沒帶就是全部員工 */
    @Transactional
    public Page<StaffResponse> getStaff(StaffFilterRequest filter, Pageable pageable){
        // keyword 不能傳 null：Hibernate 第一次遇到 null 會把它 cast 成 varchar 並快取，之後中文關鍵字都查不到
        // 空字串 LIKE '%%' 會比對到全部，效果跟不篩一樣
        String keyword = filter.keyword() == null ? "" : filter.keyword().trim();
        Page<StaffResponse> staffPage = staffRepository.findByFilter(
                keyword,filter.department(),filter.status(),pageable);

        return staffPage;
    }

    /** 改員工姓名，前後空白會先去掉 */
    @Transactional
    public void changeName(String account, String name) {
        Staff staff = findStaff(account);
        staff.setName(name.trim());
    }

    /**
     * 管理者幫員工重設密碼（員工忘記密碼時用）：產生一組亂數臨時密碼，DB 存 BCrypt 雜湊。<br>
     * 明碼只在這次回傳給管理者，之後就查不到了。
     */
    @Transactional
    public String resetPassword(String account) {
        Staff staff = findStaff(account);
        String tempPassword = randomPassword();
        staff.setPasswordHash(passwordEncoder.encode(tempPassword));
        return tempPassword;
    }

    /**
     * 停用員工帳號，停用後不能登入，舊 token 也會被 {@link CurrentStaff#require()} 擋下。<br>
     * 不能停用自己；呼叫的人一定是還在用的 ADMIN，又不能停用自己，所以不會發生「ADMIN 全被停用」。
     */
    @Transactional
    public void disable(String account) {
        Staff staff = findStaff(account);
        if (staff.getId().equals(currentStaff.getCurrentId())) {
            throw ApiException.badRequest("不能停用自己的帳號");
        }
        staff.setStatus(StaffStatus.DISABLED);
    }

    /** 重新啟用被停用的員工帳號，啟用後就能再登入 */
    @Transactional
    public void enable(String account) {
        Staff staff = findStaff(account);
        staff.setStatus(StaffStatus.ACTIVE);
    }

    /**
     * 新增員工：帳號不能重複，狀態預設是 ACTIVE。<br>
     * 密碼不用傳，跟 {@link #resetPassword(String)} 一樣由系統產生亂數臨時密碼，明碼只在這次回傳給管理者。
     */
    @Transactional
    public String createNewStaff(CreateNewStaffRequest request){
        if(staffRepository.existsByAccount(request.account())){
            throw ApiException.conflict("帳號代碼不能重複");
        }

        String tempPassword = randomPassword();

        Staff staff = Staff.builder()
                .account(request.account())
                .name(request.name())
                .department(request.department())
                .passwordHash(passwordEncoder.encode(tempPassword))
                .build();
        staffRepository.save(staff);

        return tempPassword ;
    }

    /** 用帳號找員工，找不到回 404 */
    private Staff findStaff(String account) {
        return staffRepository.findByAccount(account)
                .orElseThrow(() -> ApiException.notFound("找不到此員工帳號"));
    }

    /** 產生 10 碼亂數臨時密碼；字元表拿掉了容易看錯的 0/O、1/l/I */
    private String randomPassword() {
        String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        SecureRandom RANDOM = new SecureRandom();
        StringBuilder sb = new StringBuilder(20);
        for (int i = 0; i < 20; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
