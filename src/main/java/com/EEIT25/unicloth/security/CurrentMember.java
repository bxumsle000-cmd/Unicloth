package com.EEIT25.unicloth.security;

import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.enums.MemberStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 「目前登入的會員」：讓 Service 不必自己解析 token 就能知道現在是誰。
 * <p>
 * {@link JwtAuthFilter} 在請求進來時驗證 JWT，成功就把會員 id 放進 {@link SecurityContextHolder}，這裡再取出來。
 * SecurityContextHolder 底層是 ThreadLocal，同一個請求裡在哪一層呼叫都拿得到，請求結束後 Security 會自動清掉。
 */
@Component
@RequiredArgsConstructor
public class CurrentMember {
    private final MemberRepository memberRepository;

    /**
     * 有會員登入時回傳會員 id。
     * 商品詳細頁允許訪客查看，因此未登入或員工登入時回傳 null，不拋出 401。
     */
    public Long getCurrentIdOrNull() {
        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        // 沒帶 token 的請求，Security 會塞一個 AnonymousAuthenticationToken，它的 isAuthenticated() 也是 true，要特別排除
        if (auth == null
                || !auth.isAuthenticated()
                || auth instanceof AnonymousAuthenticationToken
                || !(auth.getPrincipal() instanceof Long memberId)) {
            return null;
        }

        return memberId;
    }

    /**
     * 取得目前登入會員的 id。
     * 正常情況下沒登入的請求在 SecurityConfig 就被擋掉了，這裡是最後一道防線，避免放行規則寫錯時拿到 null 往下傳。
     */
    public Long getCurrentId() {
        Long memberId = getCurrentIdOrNull();

        if (memberId == null) {
            throw ApiException.unauthorized(
                    "尚未登入或登入已失效"
            );
        }

        return memberId;
    }

    /** 取得目前登入的會員；資料庫查不到代表登入失效，丟 401；帳號被停用丟 403 */
    public Member require() {
        Member member =
                memberRepository
                        .findById(getCurrentId())
                        .orElseThrow(() ->
                                ApiException.unauthorized(
                                        "登入過期或失效"
                                )
                        );

        // token 發出去之後就收不回來，帳號被停用時要在這裡擋，不然舊 token 到過期前都還能用
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw ApiException.forbidden(
                    "此帳號已被停用"
            );
        }

        return member;
    }
}