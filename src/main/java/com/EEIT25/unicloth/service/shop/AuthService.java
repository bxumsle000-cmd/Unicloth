package com.EEIT25.unicloth.service.shop;

import com.EEIT25.unicloth.dto.store.auth.FirebaseLoginRequest;
import com.EEIT25.unicloth.dto.store.auth.LoginResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.enums.member.MemberStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberProfileRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.security.FirebaseTokenVerifier;
import com.EEIT25.unicloth.security.FirebaseTokenVerifier.FirebaseUser;
import com.EEIT25.unicloth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 認證相關服務<br>
 * - {@link #firebaseLogin(FirebaseLoginRequest)}：Google（Firebase）登入
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final JwtService jwtService;
    private final FirebaseTokenVerifier firebaseTokenVerifier;

    /**
     * Google 登入：驗證 Firebase ID token，找到（或建立）對應的會員，回傳我們自己的 JWT。
     * <ol>
     *   <li>用 Firebase uid 找得到 → 就是這個會員</li>
     *   <li>找不到，但同一個 email 已經用密碼註冊過 → Google 確認過 email 是本人的，才把 uid 綁到原本的帳號</li>
     *   <li>都找不到 → 建新會員（只有帳號，個人資料之後補填）</li>
     * </ol>
     */
    @Transactional
    public LoginResponse firebaseLogin(FirebaseLoginRequest request){
        FirebaseUser firebaseUser = firebaseTokenVerifier.verify(request.idToken());

        Member member = memberRepository.findByFirebaseUid(firebaseUser.uid()).orElse(null);
        if (member == null) {
            if (!StringUtils.hasText(firebaseUser.email())) {
                throw ApiException.badRequest("這個 Google 帳號沒有提供 email，無法登入");
            }

            member = memberRepository.findByEmail(firebaseUser.email()).orElse(null);
            if (member != null) {
                // email 沒驗證過，或這個帳號已經綁了別的 Google 帳號，都不能綁，避免被別人冒用
                if (!firebaseUser.emailVerified() || member.getFirebaseUid() != null) {
                    throw ApiException.conflict("此email已經註冊過");
                }
                member.setFirebaseUid(firebaseUser.uid());
            } else {
                member = memberRepository.save(Member.builder()
                        .email(firebaseUser.email())
                        .firebaseUid(firebaseUser.uid())
                        .build());
            }
        }

        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw ApiException.forbidden("此帳號已被停用");
        }

        return new LoginResponse(member.getId(), jwtService.generateToken(member.getId()),
                memberProfileRepository.existsById(member.getId()));
    }
}
