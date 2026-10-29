package com.EEIT25.unicloth.controller.store;

import com.EEIT25.unicloth.dto.store.member.ClearProductViewHistoryResponse;
import com.EEIT25.unicloth.security.CurrentMember;
import com.EEIT25.unicloth.service.shop.MemberProductViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理目前登入會員的商品瀏覽紀錄。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/member/product-views")
public class MemberProductViewController {
    private final MemberProductViewService productViewService;
    private final CurrentMember currentMember;

    /**
     * 清除目前登入會員的全部瀏覽紀錄。
     */
    @DeleteMapping
    public ClearProductViewHistoryResponse clearHistory() {
        int deletedCount =
                productViewService.clearHistory(
                        currentMember.getCurrentId()
                );

        return new ClearProductViewHistoryResponse(
                deletedCount
        );
    }
}