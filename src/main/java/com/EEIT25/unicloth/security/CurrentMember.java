package com.EEIT25.unicloth.security;

import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberRepository;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 開發用的假登入：目前寫死會員 id = 1，之後換成真正的登入機制。
 * <p>
 * 如果你資料庫的會員 id 不是 1（例如刪過資料、跑過測試，IDENTITY 號碼被用掉），
 * 可以清空會員表並把計數器歸零，重新註冊的第一個會員就會是 id = 1：
 * <pre>
 * DELETE FROM members;
 * DBCC CHECKIDENT ('members', RESEED, 0);   -- 下一筆會是 1
 * </pre>
 * 注意：
 * <ul>
 *   <li>購物車、追蹤清單、會員折價券會跟著刪掉（ON DELETE CASCADE）</li>
 *   <li>有訂單時會刪不掉（orders 的 FK 沒設 CASCADE），要先刪訂單</li>
 *   <li>不能用 TRUNCATE：有其他表的 FK 參照 members，SQL Server 不允許</li>
 * </ul>
 */
@Component
@Getter
@RequiredArgsConstructor
public class CurrentMember {
    private final  Long  currentId = 1L ;
    private final  String currentToken = "DEV_CURRENT_TOKEN" ;

    @Getter(AccessLevel.NONE)
    private final MemberRepository memberRepository;

    /** 取得目前登入的會員；資料庫查不到代表登入失效，丟 401 */
    public Member require() {
        return memberRepository.findById(currentId)
                .orElseThrow(() -> ApiException.unauthorized("登入過期或失效"));
    }
}
