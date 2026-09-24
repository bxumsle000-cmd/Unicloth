package com.EEIT25.unicloth.controller;

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
    public void login(){

    }
    /** 登出 */
    @PostMapping("/logout")
    public void logout() {
    }

    /** 取得目前登入者資料 */
    @GetMapping("/me")
    public void me() {
    }

}
