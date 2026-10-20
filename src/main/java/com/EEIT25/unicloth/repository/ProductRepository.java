package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    boolean existsBySlug(String slug);

    /**
     * 檢查商品貨號是否已被使用。
     * 例如 suffix 傳入 -123456。
     */
    boolean existsBySlugEndingWith(String suffix);

    /**
     * 分類 id 在清單內、且狀態符合的商品。
     */
    Page<Product> findByCategoryIdInAndStatus(
            Collection<Long> categoryIds,
            ProductStatus status,
            Pageable pageable
    );

    /**
     * 分類商品與篩選。
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.category.id IN :categoryIds
              AND p.status = :status
              AND (
                    :minPrice IS NULL
                    OR p.price >= :minPrice
              )
              AND (
                    :maxPrice IS NULL
                    OR p.price <= :maxPrice
              )
              AND (
                    :filterSku = false
                    OR EXISTS (
                        SELECT v.id
                        FROM ProductVariant v
                        WHERE v.product = p
                          AND (
                                :allColors = true
                                OR v.color IN :colors
                          )
                          AND (
                                :allSizes = true
                                OR v.size IN :sizes
                          )
                    )
              )
            """)
    Page<Product> findByFilter(
            Collection<Long> categoryIds,
            ProductStatus status,
            Integer minPrice,
            Integer maxPrice,
            boolean filterSku,
            boolean allColors,
            Collection<String> colors,
            boolean allSizes,
            Collection<String> sizes,
            Pageable pageable
    );

    /**
     * 依 slug 查詢上架中的商品。
     */
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.slug = :slug
              AND p.status =
                  com.EEIT25.unicloth.enums.ProductStatus.ON_SALE
            """)
    Optional<Product> findOnSaleBySlug(
            @Param("slug")
            String slug
    );

    /**
     * 前台用商品名稱搜尋。
     */
    Page<Product> findByStatusAndNameContainingIgnoreCase(
            ProductStatus status,
            String name,
            Pageable pageable
    );

    /**
     * 後台商品列表。
     *
     * keyword 空白時查全部。
     * status 是 null 時不限商品狀態。
     */
    @Query("""
            SELECT p
            FROM Product p
            WHERE (
                :keyword = ''
                OR LOWER(p.name)
                    LIKE LOWER(
                        CONCAT('%', :keyword, '%')
                    )
                OR LOWER(p.slug)
                    LIKE LOWER(
                        CONCAT('%', :keyword, '%')
                    )
            )
            AND (
                :status IS NULL
                OR p.status = :status
            )
            """)
    Page<Product> findAdminProducts(
            @Param("keyword")
            String keyword,

            @Param("status")
            ProductStatus status,

            Pageable pageable
    );

    /**
     * 將已到預定時間的上架商品改為下架。
     *
     * 同時清除已執行的下架時間，
     * 避免商品重新上架後又被舊時間下架。
     *
     * 回傳實際下架的商品數量。
     * 必須由有 @Transactional 的服務呼叫。
     */
    @Modifying(
            flushAutomatically = true,
            clearAutomatically = true
    )
    @Query("""
            UPDATE Product p
            SET p.status = :offShelfStatus,
                p.scheduledOffAt = null
            WHERE p.status = :onSaleStatus
              AND p.scheduledOffAt IS NOT NULL
              AND p.scheduledOffAt <= :now
            """)
    int offShelfDueProducts(
            @Param("now")
            LocalDateTime now,

            @Param("onSaleStatus")
            ProductStatus onSaleStatus,

            @Param("offShelfStatus")
            ProductStatus offShelfStatus
    );
}