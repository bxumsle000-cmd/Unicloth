package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    // 購物車頁面：一次把 SKU 和商品都 JOIN FETCH 進來，避免逐筆 LAZY 查詢（N+1）
    @Query("""
            select c from CartItem c
            join fetch c.variant v
            join fetch v.product
            where c.member.id = :memberId
            order by c.createdAt
            """)
    List<CartItem> findCartWithProducts(@Param("memberId") Long memberId);

    Optional<CartItem> findByVariant(ProductVariant variant);

    Optional<CartItem> findByMemberAndVariant(Member member, ProductVariant variant);

    Optional<CartItem> findByIdAndMember(long l,Member member);

    long deleteByIdAndMember(Long id, Member member);

    // 結帳完成後清空購物車（delete 類方法要在 Service 加 @Transactional）
    void deleteByMemberId(Long memberId);
}
