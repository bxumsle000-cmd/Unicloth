package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.auth.FirebaseLoginRequest;
import com.EEIT25.unicloth.dto.auth.LoginRequest;
import com.EEIT25.unicloth.dto.auth.LoginResponse;
import com.EEIT25.unicloth.dto.auth.RegisterRequest;
import com.EEIT25.unicloth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    /** 登入 */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request){
        return authService.login(request);
    }

    /** Google 登入：前端用 Firebase 登入後，把 ID token 送來換我們自己的 JWT */
    @PostMapping("/firebase")
    public LoginResponse firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request){
        return authService.firebaseLogin(request);
    }

    /** 註冊 */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
    }

    /** 登出 */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout() {
    }

}
