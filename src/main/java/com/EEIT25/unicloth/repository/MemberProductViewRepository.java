package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.MemberProductView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface MemberProductViewRepository
        extends JpaRepository<MemberProductView, Long> {
    /**
     * 距離上次瀏覽超過指定時間才累加。
     */
    @Modifying
    @Query("""
            UPDATE MemberProductView productView
            SET productView.viewCount = productView.viewCount + 1,
                productView.lastViewedAt = :viewedAt
            WHERE productView.member.id = :memberId
              AND productView.product.id = :productId
              AND productView.lastViewedAt < :viewCutoff
            """)
    int incrementViewCountIfExpired(
            @Param("memberId") Long memberId,
            @Param("productId") Long productId,
            @Param("viewedAt") LocalDateTime viewedAt,
            @Param("viewCutoff") LocalDateTime viewCutoff
    );

    /**
     * 確認會員是否已有這件商品的瀏覽紀錄。
     */
    boolean existsByMemberIdAndProductId(
            Long memberId,
            Long productId
    );

    /**
     * 清除指定會員的全部瀏覽紀錄。
     */
    @Modifying
    @Query("""
            DELETE FROM MemberProductView productView
            WHERE productView.member.id = :memberId
            """)
    int deleteAllByMemberId(
            @Param("memberId") Long memberId
    );
}