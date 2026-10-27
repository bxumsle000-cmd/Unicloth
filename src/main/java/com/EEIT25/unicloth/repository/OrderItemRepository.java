package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.dto.analytics.ProductSalesResponse;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;
import com.EEIT25.unicloth.enums.order.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface OrderItemRepository
        extends JpaRepository<OrderItem, Long> {
    // 一張訂單的所有明細（明細本身就是快照，不需要再 JOIN 商品）
    List<OrderItem> findByOrderId(Long orderId);

    List<OrderItem> findByOrder(Order order);

    /**
     * 統計指定期間內各商品的有效銷售資料。
     * 先依售出件數排序，同件數時依銷售金額排序。
     */
    @Query("""
            SELECT new com.EEIT25.unicloth.dto.analytics.ProductSalesResponse(
                product.id,
                product.slug,
                product.name,
                product.imageUrl,
                SUM(orderItem.qty),
                COUNT(DISTINCT customerOrder.id),
                SUM(orderItem.totalPrice)
            )
            FROM OrderItem orderItem
            JOIN orderItem.order customerOrder
            JOIN orderItem.variant variant
            JOIN variant.product product
            WHERE customerOrder.status NOT IN :excludedStatuses
              AND customerOrder.createdAt >= :startAt
              AND customerOrder.createdAt < :endAt
            GROUP BY product.id,
                     product.slug,
                     product.name,
                     product.imageUrl
            ORDER BY SUM(orderItem.qty) DESC,
                     SUM(orderItem.totalPrice) DESC,
                     product.id DESC
            """)
    List<ProductSalesResponse> findProductSales(
            @Param("excludedStatuses")
            Collection<OrderStatus> excludedStatuses,
            @Param("startAt")
            LocalDateTime startAt,
            @Param("endAt")
            LocalDateTime endAt,
            Pageable pageable
    );
}