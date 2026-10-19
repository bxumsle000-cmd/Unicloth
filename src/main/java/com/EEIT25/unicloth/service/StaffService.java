package com.EEIT25.unicloth.service;

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

@Service
@RequiredArgsConstructor
public class StaffService {
    private final PasswordEncoder passwordEncoder;
    private final CurrentStaff currentStaff;
    private final StaffRepository staffRepository;


    @Transactional
    public Page<StaffResponse> getStaff(StaffFilterRequest filter, Pageable pageable){
        Page<StaffResponse> staffPage = staffRepository.findByFilter(
                filter.keyword(),filter.department(),filter.status(),pageable);

        return staffPage;
    }

    /** 改員工姓名 */
    @Transactional
    public void changeName(String account, String name) {
        Staff staff = findStaff(account);
        staff.setName(name.trim());
    }

    /**
     * 管理者幫員工重設密碼（員工忘記密碼時用）：產生一組亂數臨時密碼，DB 存 BCrypt 雜湊，
     * 明碼只在這次回傳給管理者，之後就查不到了
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
     * 不能停用自己；呼叫的人一定是還在用的 ADMIN，又不能停用自己，所以不會發生「ADMIN 全被停用」
     */
    @Transactional
    public void disable(String account) {
        Staff staff = findStaff(account);
        if (staff.getId().equals(currentStaff.getCurrentId())) {
            throw ApiException.badRequest("不能停用自己的帳號");
        }
        staff.setStatus(StaffStatus.DISABLED);
    }

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


    private Staff findStaff(String account) {
        return staffRepository.findByAccount(account)
                .orElseThrow(() -> ApiException.notFound("找不到此員工帳號"));
    }

    private String randomPassword() {
        String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        SecureRandom RANDOM = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
