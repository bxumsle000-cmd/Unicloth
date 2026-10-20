package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.ProductStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductVariantRepository
        extends JpaRepository<ProductVariant, Long> {

    /**
     * 一次撈出多件商品的所有 SKU。
     */
    List<ProductVariant>
    findByProductIdInOrderByIdAsc(
            Collection<Long> productIds
    );

    /**
     * 一件商品的所有 SKU。
     */
    List<ProductVariant>
    findByProductIdOrderByIdAsc(
            Long productId
    );

    /**
     * 查詢上架中商品的庫存警示。
     *
     * stock = 0 代表缺貨。
     * stock > 0 且小於等於 threshold 代表快賣完。
     *
     * JOIN FETCH 同時取得商品資料，
     * 避免讀取每個 SKU 時重複查詢商品。
     */
    @Query("""
            SELECT variant
            FROM ProductVariant variant
            JOIN FETCH variant.product product
            WHERE product.status = :status
              AND variant.stock <= :threshold
            ORDER BY
                product.id DESC,
                variant.stock ASC,
                variant.id ASC
            """)
    List<ProductVariant> findStockWarnings(
            @Param("status")
            ProductStatus status,

            @Param("threshold")
            Integer threshold
    );

    /**
     * 進貨或盤點時鎖定指定 SKU。
     *
     * PESSIMISTIC_WRITE 會讓其他庫存異動等待目前交易完成，
     * 避免兩個請求同時讀到相同的舊庫存。
     *
     * JOIN FETCH 同時載入商品，
     * 方便建立商品名稱等異動快照。
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT variant
            FROM ProductVariant variant
            JOIN FETCH variant.product
            WHERE variant.id IN :variantIds
            """)
    List<ProductVariant> findAllByIdInForUpdate(
            @Param("variantIds")
            Collection<Long> variantIds
    );

    /**
     * 指定分類底下、狀態符合的商品，
     * SKU 出現過的所有顏色。
     */
    @Query("""
            SELECT DISTINCT variant.color
            FROM ProductVariant variant
            WHERE variant.product.category.id
                    IN :categoryIds
              AND variant.product.status = :status
            """)
    List<String> findDistinctColors(
            Collection<Long> categoryIds,
            ProductStatus status
    );

    /**
     * 指定分類底下、狀態符合的商品，
     * SKU 出現過的所有尺寸。
     */
    @Query("""
            SELECT DISTINCT variant.size
            FROM ProductVariant variant
            WHERE variant.product.category.id
                    IN :categoryIds
              AND variant.product.status = :status
            """)
    List<String> findDistinctSizes(
            Collection<Long> categoryIds,
            ProductStatus status
    );

    /**
     * 種子資料匯入時檢查 SKU 是否已存在。
     */
    boolean existsBySkuCodeIn(
            Collection<String> skuCodes
    );

    /**
     * 結帳時庫存足夠才扣除。
     *
     * 回傳 0 代表 SKU 不存在或庫存不足。
     */
    @Modifying
    @Query("""
            UPDATE ProductVariant variant
            SET variant.stock =
                    variant.stock - :qty
            WHERE variant.id = :variantId
              AND variant.stock >= :qty
            """)
    int deductStock(
            @Param("variantId")
            Long variantId,

            @Param("qty")
            int qty
    );

    /**
     * 取消訂單時將庫存加回。
     */
    @Modifying
    @Query("""
            UPDATE ProductVariant variant
            SET variant.stock =
                    variant.stock + :qty
            WHERE variant.id = :variantId
            """)
    int restoreStock(
            @Param("variantId")
            Long variantId,

            @Param("qty")
            int qty
    );
}