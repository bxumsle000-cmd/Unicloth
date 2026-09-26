package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    // 一次撈出多件商品的所有 SKU（列表頁拿縮圖用，避免一件商品查一次）
    List<ProductVariant> findByProductIdInOrderByIdAsc(Collection<Long> productIds);
}
