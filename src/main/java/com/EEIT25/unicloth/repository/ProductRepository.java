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
     */
    boolean existsBySlugEndingWith(String suffix);

    /**
     * 查詢分類底下指定狀態的商品。
     */
    Page<Product> findByCategoryIdInAndStatus(
            Collection<Long> categoryIds,
            ProductStatus status,
            Pageable pageable
    );

    /**
     * 查詢分類商品並套用價格、顏色及尺寸篩選。
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.category.id IN :categoryIds
              AND p.status = :status
              AND (:minPrice IS NULL OR p.price >= :minPrice)
              AND (:maxPrice IS NULL OR p.price <= :maxPrice)
              AND (:filterSku = false OR EXISTS (
                    SELECT v.id FROM ProductVariant v
                    WHERE v.product = p
                      AND (:allColors = true OR v.color IN :colors)
                      AND (:allSizes = true OR v.size IN :sizes)))
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
     * 使用 slug 查詢上架中的商品。
     */
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.slug = :slug
              AND p.status =
                  com.EEIT25.unicloth.enums.ProductStatus.ON_SALE
            """)
    Optional<Product> findOnSaleBySlug(
            @Param("slug") String slug
    );

    /**
     * 使用商品名稱搜尋上架中的商品。
     */
    Page<Product> findByStatusAndNameContainingIgnoreCase(
            ProductStatus status,
            String name,
            Pageable pageable
    );

    /**
     * 使用商品名稱、風格名稱或風格代碼搜尋。
     */
    @Query("""
            SELECT DISTINCT p
            FROM Product p
            LEFT JOIN p.styles style
            WHERE p.status = :status
              AND (
                  LOWER(p.name)
                      LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR LOWER(style.name)
                      LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR LOWER(style.code)
                      LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            """)
    Page<Product> findByKeywordOrStyle(
            @Param("status") ProductStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * 搜尋商品名稱、直接符合風格及相關風格。
     * 排序順序：名稱符合、直接風格、相關風格。
     */
    @Query("""
        SELECT product
        FROM Product product
        WHERE product.status = :status
          AND (
              LOWER(product.name)
                  LIKE LOWER(CONCAT('%', :keyword, '%'))
              OR (
                  :hasDirectStyles = true
                  AND EXISTS (
                      SELECT direct_style.id
                      FROM Product direct_product
                      JOIN direct_product.styles direct_style
                      WHERE direct_product.id = product.id
                        AND direct_style.id
                            IN :directStyleIds
                  )
              )
              OR (
                  :hasRelatedStyles = true
                  AND EXISTS (
                      SELECT related_style.id
                      FROM Product related_product
                      JOIN related_product.styles related_style
                      WHERE related_product.id = product.id
                        AND related_style.id
                            IN :relatedStyleIds
                  )
              )
          )
        ORDER BY
          CASE
              WHEN LOWER(product.name)
                  LIKE LOWER(CONCAT('%', :keyword, '%'))
                  THEN 0
              WHEN (
                  :hasDirectStyles = true
                  AND EXISTS (
                      SELECT direct_style.id
                      FROM Product direct_product
                      JOIN direct_product.styles direct_style
                      WHERE direct_product.id = product.id
                        AND direct_style.id
                            IN :directStyleIds
                  )
              )
                  THEN 1
              ELSE 2
          END
        """)
    Page<Product> findByKeywordAndStyleGroups(
            @Param("status")
            ProductStatus status,
            @Param("keyword")
            String keyword,
            @Param("hasDirectStyles")
            boolean hasDirectStyles,
            @Param("directStyleIds")
            Collection<Long> directStyleIds,
            @Param("hasRelatedStyles")
            boolean hasRelatedStyles,
            @Param("relatedStyleIds")
            Collection<Long> relatedStyleIds,
            Pageable pageable
    );

    /**
     * 後台商品列表。
     */
    @Query("""
        SELECT product
        FROM Product product
        WHERE (
              :keyword = ''
              OR LOWER(product.name)
                  LIKE LOWER(CONCAT('%', :keyword, '%'))
              OR LOWER(product.slug)
                  LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
          AND (
              :status IS NULL
              OR product.status = :status
          )
        """)
    Page<Product> findAdminProducts(
            @Param("keyword") String keyword,
            @Param("status") ProductStatus status,
            Pageable pageable
    );

    /**
     * 將已到預定時間的商品下架。
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
            @Param("now") LocalDateTime now,
            @Param("onSaleStatus")
            ProductStatus onSaleStatus,
            @Param("offShelfStatus")
            ProductStatus offShelfStatus
    );
}