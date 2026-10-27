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
import java.util.List;
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
     * 分類 id 在清單內、且狀態符合的商品（分頁）。
     */
    Page<Product> findByCategoryIdInAndStatus(
            Collection<Long> categoryIds,
            ProductStatus status,
            Pageable pageable
    );

    /**
     * 分類商品 + 篩選（分頁）。每個條件都是「沒帶就不篩」：<br>
     * - 價格：minPrice / maxPrice 是 null → (NULL IS NULL OR …) 永遠成立，等於沒這個條件<br>
     * - 顏色 / 尺寸：清單不能寫 :colors IS NULL（Hibernate 會把清單展開），所以另外傳布林旗標：
     *   allColors = true 表示不篩顏色；這時 colors 只是佔位值，不會被用到<br>
     * - filterSku = false（顏色、尺寸都沒選）→ 整段 EXISTS 跳過<br>
     * 顏色和尺寸放在同一個 EXISTS：選黑色 + M，要同一個 SKU 是黑色 M 號才算。
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
     * 上架中的商品（依 slug）。
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
     * 狀態符合、名稱包含關鍵字的商品（分頁），不分大小寫；
     * LIKE 的 % 和 _ 由 Spring 自動跳脫。
     */
    Page<Product> findByStatusAndNameContainingIgnoreCase(
            ProductStatus status,
            String name,
            Pageable pageable
    );

    /**
     * 上架且標示為新品的商品（分頁）。
     */
    Page<Product> findByStatusAndNewArrivalTrue(
            ProductStatus status,
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
     * 排序順序：商品名稱符合、直接風格符合、相關風格符合。
     * hasDirectStyles 和 hasRelatedStyles 用來避免查詢空的 IN 清單。
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
     * 依會員各風格的累積瀏覽分數推薦尚未瀏覽的上架商品。
     * 商品符合的風格分數會加總，同分時依最近偏好、熱門標記及商品 id 排序。
     */
    @Query(
            value = """
                    SELECT candidate_style.product_id
                    FROM product_styles candidate_style
                    JOIN products candidate_product
                      ON candidate_product.id =
                         candidate_style.product_id
                    JOIN (
                        SELECT viewed_style.style_id,
                               SUM(product_view.view_count)
                                   AS style_score,
                               MAX(product_view.last_viewed_at)
                                   AS last_viewed_at
                        FROM member_product_views product_view
                        JOIN product_styles viewed_style
                          ON viewed_style.product_id =
                             product_view.product_id
                        WHERE product_view.member_id =
                              :memberId
                        GROUP BY viewed_style.style_id
                    ) preference
                      ON preference.style_id =
                         candidate_style.style_id
                    WHERE candidate_product.status =
                          'ON_SALE'
                      AND NOT EXISTS (
                          SELECT 1
                          FROM member_product_views viewed_product
                          WHERE viewed_product.member_id =
                                :memberId
                            AND viewed_product.product_id =
                                candidate_style.product_id
                      )
                    GROUP BY candidate_style.product_id,
                             candidate_product.is_hot
                    ORDER BY
                        SUM(preference.style_score) DESC,
                        MAX(preference.last_viewed_at) DESC,
                        candidate_product.is_hot DESC,
                        candidate_style.product_id DESC
                    """,
            nativeQuery = true
    )
    List<Long> findRecommendationProductIds(
            @Param("memberId") Long memberId,
            Pageable pageable
    );

    /**
     * 後台商品列表。
     * keyword 空白時查全部；status 是 null 時不限商品狀態。
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
     * 將已到預定時間的上架商品改為下架。
     * 同時清除已執行的下架時間，避免商品重新上架後又被舊時間下架。
     * 回傳實際下架的商品數量。必須由有 @Transactional 的服務呼叫。
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