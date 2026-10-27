package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberProductView;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.repository.MemberProductViewRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

/**
 * 記錄與管理會員的商品瀏覽資料。
 */
@Service
@RequiredArgsConstructor
public class MemberProductViewService {
    private static final int VIEW_INTERVAL_MINUTES = 30;

    private final MemberProductViewRepository productViewRepository;
    private final MemberRepository memberRepository;

    /**
     * 同一會員在 30 分鐘內重複瀏覽同一商品只計算一次。
     */
    @Transactional
    public void recordView(
            Long memberId,
            Product product
    ) {
        if (memberId == null) {
            return;
        }

        LocalDateTime viewedAt =
                LocalDateTime.now();

        LocalDateTime viewCutoff =
                viewedAt.minusMinutes(
                        VIEW_INTERVAL_MINUTES
                );

        int updatedRows =
                productViewRepository
                        .incrementViewCountIfExpired(
                                memberId,
                                product.getId(),
                                viewedAt,
                                viewCutoff
                        );

        if (updatedRows > 0) {
            return;
        }

        // 已存在代表仍在 30 分鐘內，不重複累加。
        if (productViewRepository
                .existsByMemberIdAndProductId(
                        memberId,
                        product.getId()
                )) {
            return;
        }

        // 第一次瀏覽時建立會員與商品的關聯。
        Member member =
                memberRepository
                        .getReferenceById(memberId);

        productViewRepository.save(
                MemberProductView.builder()
                        .member(member)
                        .product(product)
                        .viewCount(1)
                        .build()
        );
    }

    /**
     * 清除指定會員的全部瀏覽紀錄。
     */
    @Transactional
    public int clearHistory(
            Long memberId
    ) {
        return productViewRepository
                .deleteAllByMemberId(memberId);
    }
}