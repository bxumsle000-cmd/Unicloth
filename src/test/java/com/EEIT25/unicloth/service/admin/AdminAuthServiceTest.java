package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.StaffLoginRequest;
import com.EEIT25.unicloth.dto.admin.StaffLoginResponse;
import com.EEIT25.unicloth.entity.Staff;
import com.EEIT25.unicloth.enums.Department;
import com.EEIT25.unicloth.enums.StaffStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.StaffRepository;
import com.EEIT25.unicloth.security.CurrentStaff;
import com.EEIT25.unicloth.security.JwtProperties;
import com.EEIT25.unicloth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 員工登入的單元測試，不啟動 Spring、不連資料庫：StaffRepository 換成假的，其他用真的物件。
 */
class AdminAuthServiceTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    private static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();
    private static final String PASSWORD_HASH = PASSWORD_ENCODER.encode("Test1234");

    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final JwtService jwtService = new JwtService(new JwtProperties(SECRET, 60_000));
    private final CurrentStaff currentStaff = mock(CurrentStaff.class);
    private final AdminAuthService adminAuthService = new AdminAuthService(staffRepository, PASSWORD_ENCODER, jwtService, currentStaff);

    private Staff product01;

    @BeforeEach
    void setUp() {
        // 商品部的員工
        product01 = Staff.builder()
                .id(3L)
                .account("product01")
                .passwordHash(PASSWORD_HASH)
                .name("陳怡君")
                .department(Department.PRODUCT)
                .build();
        when(staffRepository.findByAccount("product01")).thenReturn(Optional.of(product01));
    }

    @Test
    void 登入成功_token是員工token_帶所屬部門() {
        StaffLoginResponse response = adminAuthService.login(new StaffLoginRequest("product01", "Test1234", Department.PRODUCT));

        assertThat(response.staffId()).isEqualTo(3L);
        assertThat(response.name()).isEqualTo("陳怡君");
        assertThat(response.department()).isEqualTo(Department.PRODUCT);

        JwtService.ParsedToken parsed = jwtService.parse(response.token());
        assertThat(parsed.staff()).isTrue();
        assertThat(parsed.id()).isEqualTo(3L);
        assertThat(parsed.department()).isEqualTo(Department.PRODUCT);
    }

    @Test
    void 登入成功_更新最後登入時間() {
        adminAuthService.login(new StaffLoginRequest("product01", "Test1234", Department.PRODUCT));

        assertThat(product01.getLastLoginAt()).isNotNull();
    }

    @Test
    void 帳號不存在_401() {
        assertStatus(new StaffLoginRequest("nobody", "Test1234", Department.PRODUCT),
                HttpStatus.UNAUTHORIZED, "帳號或密碼錯誤");
    }

    @Test
    void 密碼錯誤_401_訊息跟帳號不存在一樣() {
        assertStatus(new StaffLoginRequest("product01", "wrong", Department.PRODUCT),
                HttpStatus.UNAUTHORIZED, "帳號或密碼錯誤");
    }

    @Test
    void 帳號停用_403() {
        product01.setStatus(StaffStatus.DISABLED);

        assertStatus(new StaffLoginRequest("product01", "Test1234", Department.PRODUCT),
                HttpStatus.FORBIDDEN, "此帳號已被停用");
    }

    @Test
    void 不屬於選的部門_403() {
        assertStatus(new StaffLoginRequest("product01", "Test1234", Department.MKT),
                HttpStatus.FORBIDDEN, "此帳號不屬於「行銷」，請改選其他部門");
    }

    @Test
    void 管理者選其他部門_可以登入_回傳選的部門_token還是ADMIN() {
        Staff admin01 = Staff.builder()
                .id(1L)
                .account("admin01")
                .passwordHash(PASSWORD_HASH)
                .name("管理者")
                .department(Department.ADMIN)
                .build();
        when(staffRepository.findByAccount("admin01")).thenReturn(Optional.of(admin01));

        StaffLoginResponse response = adminAuthService.login(new StaffLoginRequest("admin01", "Test1234", Department.PRODUCT));

        assertThat(response.department()).isEqualTo(Department.PRODUCT);
        assertThat(jwtService.parse(response.token()).department()).isEqualTo(Department.ADMIN);
    }

    @Test
    void 密碼錯又選錯部門_先回密碼錯誤_不透露部門資訊() {
        assertStatus(new StaffLoginRequest("product01", "wrong", Department.MKT),
                HttpStatus.UNAUTHORIZED, "帳號或密碼錯誤");
    }

    private void assertStatus(StaffLoginRequest request, HttpStatus status, String message) {
        assertThatThrownBy(() -> adminAuthService.login(request))
                .isInstanceOf(ApiException.class)
                .hasMessage(message)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(status);
    }
}
