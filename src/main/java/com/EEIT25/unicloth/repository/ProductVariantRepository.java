package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.product.ProductStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    // 一次撈出多件商品的所有 SKU（列表頁拿縮圖用，避免一件商品查一次）
    List<ProductVariant> findByProductIdInOrderByIdAsc(Collection<Long> productIds);

    // 一件商品的所有 SKU，照 id 排序（商品詳細頁用）
    List<ProductVariant> findByProductIdOrderByIdAsc(Long productId);

    /**
     * 查詢上架中商品的庫存警示。
     * stock = 0 代表缺貨；stock > 0 且小於等於 threshold 代表快賣完。
     * JOIN FETCH 同時取得商品資料，避免讀取每個 SKU 時重複查詢商品。
     */
    @Query("""
            SELECT variant
            FROM ProductVariant variant
            JOIN FETCH variant.product product
            WHERE product.status = :status
              AND variant.stock <= :threshold
            ORDER BY product.id DESC, variant.stock ASC, variant.id ASC
            """)
    List<ProductVariant> findStockWarnings(@Param("status") ProductStatus status,
                                           @Param("threshold") Integer threshold);

    /**
     * 進貨或盤點時鎖定指定 SKU。
     * PESSIMISTIC_WRITE 會讓其他庫存異動等待目前交易完成，避免兩個請求同時讀到相同的舊庫存。
     * JOIN FETCH 同時載入商品，方便建立商品名稱等異動快照。
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT variant
            FROM ProductVariant variant
            JOIN FETCH variant.product
            WHERE variant.id IN :variantIds
            """)
    List<ProductVariant> findAllByIdInForUpdate(@Param("variantIds") Collection<Long> variantIds);

    /** 這些分類底下、狀態符合的商品，SKU 出現過的所有顏色（不重複，篩選選項用） */
    @Query("""
            SELECT DISTINCT v.color FROM ProductVariant v
            WHERE v.product.category.id IN :categoryIds AND v.product.status = :status
            """)
    List<String> findDistinctColors(Collection<Long> categoryIds, ProductStatus status);

    /** 同上，出現過的所有尺寸 */
    @Query("""
            SELECT DISTINCT v.size FROM ProductVariant v
            WHERE v.product.category.id IN :categoryIds AND v.product.status = :status
            """)
    List<String> findDistinctSizes(Collection<Long> categoryIds, ProductStatus status);

    // 匯入種子資料用：同一件商品換了性別 slug 會不同，但 SKU 一樣，用 SKU 判斷是否已匯過
    boolean existsBySkuCodeIn(Collection<String> skuCodes);

    // ==================== 以下提供給訂單模組（CheckoutService 結帳）使用 ====================

    /** 庫存夠才扣；回傳更新了幾筆（0 = 庫存不足或 SKU 不存在） */
    @Modifying
    @Query("""
            UPDATE ProductVariant v SET v.stock = v.stock - :qty
            WHERE v.id = :variantId AND v.stock >= :qty
            """)
    int deductStock(@Param("variantId") Long variantId, @Param("qty") int qty);

    /** 取消訂單時把庫存加回去（OrderService.cancelOrder 使用） */
    @Modifying
    @Query("""
            UPDATE ProductVariant v SET v.stock = v.stock + :qty
            WHERE v.id = :variantId
            """)
    int restoreStock(@Param("variantId") Long variantId, @Param("qty") int qty);
}