package com.EEIT25.unicloth.controller.store;

import com.EEIT25.unicloth.dto.store.auth.FirebaseLoginRequest;
import com.EEIT25.unicloth.dto.store.auth.LoginResponse;
import com.EEIT25.unicloth.service.shop.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    /** Google 登入：前端用 Firebase 登入後，把 ID token 送來換我們自己的 JWT */
    @PostMapping("/firebase")
    public LoginResponse firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request){
        return authService.firebaseLogin(request);
    }

    /** 登出 */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout() {
    }

}
