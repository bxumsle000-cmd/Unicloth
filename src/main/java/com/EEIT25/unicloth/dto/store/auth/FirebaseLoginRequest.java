package com.EEIT25.unicloth.dto.store.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * @param idToken 前端 Firebase SDK 登入後拿到的 ID token（user.getIdToken()）
 */
public record FirebaseLoginRequest(
        @NotBlank String idToken
) {
}
