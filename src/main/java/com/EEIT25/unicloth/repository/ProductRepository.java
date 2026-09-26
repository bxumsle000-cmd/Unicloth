package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySlug(String slug);

    /** 分類 id 在清單內、且狀態符合的商品（分頁）*/
    Page<Product> findByCategoryIdInAndStatus(Collection<Long> categoryIds, String status, Pageable pageable);
}
