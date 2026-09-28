package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    // 一次撈出多件商品的所有 SKU（列表頁拿縮圖用，避免一件商品查一次）
    List<ProductVariant> findByProductIdInOrderByIdAsc(Collection<Long> productIds);

    // 一件商品的所有 SKU，照 id 排序（商品詳細頁用）
    List<ProductVariant> findByProductIdOrderByIdAsc(Long productId);

    /** 這些分類底下、狀態符合的商品，SKU 出現過的所有顏色（不重複，篩選選項用） */
    @Query("""
            SELECT DISTINCT v.color FROM ProductVariant v
            WHERE v.product.category.id IN :categoryIds AND v.product.status = :status
            """)
    List<String> findDistinctColors(Collection<Long> categoryIds, String status);

    /** 同上，出現過的所有尺寸 */
    @Query("""
            SELECT DISTINCT v.size FROM ProductVariant v
            WHERE v.product.category.id IN :categoryIds AND v.product.status = :status
            """)
    List<String> findDistinctSizes(Collection<Long> categoryIds, String status);
}
