package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.auth.LoginRequest;
import com.EEIT25.unicloth.dto.auth.LoginResponse;
import com.EEIT25.unicloth.dto.auth.RegisterRequest;
import com.EEIT25.unicloth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    /** 登入 */
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request){
        return authService.login(request);
    }

    /** 註冊 */
    @PostMapping("/register")
    public void register(@RequestBody RegisterRequest request) {
        authService.register(request);
    }

    /** 登出 */
    @PostMapping("/logout")
    public void logout() {
    }

}
