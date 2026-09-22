package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    // 追蹤清單頁面：連商品一起撈
    @Query("""
            select w from WishlistItem w
            join fetch w.product
            where w.member.id = :memberId
            order by w.createdAt desc
            """)
    List<WishlistItem> findWishlistWithProducts(@Param("memberId") Long memberId);

    // 商品頁顯示「已追蹤 / 未追蹤」
    boolean existsByMemberIdAndProductId(Long memberId, Long productId);

    // 取消追蹤（delete 類方法要在 Service 加 @Transactional）
    void deleteByMemberIdAndProductId(Long memberId, Long productId);
}
