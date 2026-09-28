package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySlug(String slug);

    /** 分類 id 在清單內、且狀態符合的商品（分頁）*/
    Page<Product> findByCategoryIdInAndStatus(Collection<Long> categoryIds, String status, Pageable pageable);

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
            WHERE p.category.id IN :categoryIds AND p.status = :status
              AND (:minPrice IS NULL OR p.price >= :minPrice)
              AND (:maxPrice IS NULL OR p.price <= :maxPrice)
              AND (:filterSku = false OR EXISTS (
                    SELECT v.id FROM ProductVariant v
                    WHERE v.product = p
                      AND (:allColors = true OR v.color IN :colors)
                      AND (:allSizes = true OR v.size IN :sizes)))
            """)
    Page<Product> findByFilter(Collection<Long> categoryIds, String status,
                               Integer minPrice, Integer maxPrice,
                               boolean filterSku,
                               boolean allColors, Collection<String> colors,
                               boolean allSizes, Collection<String> sizes,
                               Pageable pageable);

    /** 上架中的商品（依 slug） */
    @Query("SELECT p FROM Product p WHERE p.slug = :slug AND p.status = 'on_sale'")
    Optional<Product> findOnSaleBySlug(String slug);

    /** 這些分類底下、狀態符合的商品，最低售價；沒有商品時是 null */
    @Query("SELECT MIN(p.price) FROM Product p WHERE p.category.id IN :categoryIds AND p.status = :status")
    Integer findMinPrice(Collection<Long> categoryIds, String status);

    /** 同上，最高售價；沒有商品時是 null */
    @Query("SELECT MAX(p.price) FROM Product p WHERE p.category.id IN :categoryIds AND p.status = :status")
    Integer findMaxPrice(Collection<Long> categoryIds, String status);

    /** 狀態符合、名稱包含關鍵字的商品（分頁），不分大小寫；LIKE 的 % _ 由 Spring 自動跳脫 */
    Page<Product> findByStatusAndNameContainingIgnoreCase(String status, String name, Pageable pageable);
}
