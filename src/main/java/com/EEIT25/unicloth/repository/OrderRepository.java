package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.order.PaymentMethod;
import com.EEIT25.unicloth.enums.order.ShippingMethod;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    // 用訂單編號查（例如 UC20260901-8842）
    Optional<Order> findByOrderNo(String orderNo);

    // 產生訂單編號時檢查是否撞號
    boolean existsByOrderNo(String orderNo);

    // 會員的訂單列表，最新的在前
    List<Order> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    // 訂單詳情：同時比對 memberId，避免會員看到別人的訂單
    Optional<Order> findByIdAndMemberId(Long id, Long memberId);

    // 後台依狀態篩選
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    /**
     * 訂單物流後台列表：關鍵字可查訂單編號、會員 Email、收件人；
     * 狀態與配送方式不帶時就不篩選。
     * EntityGraph 會同時取得會員資料，避免列表每筆訂單又查一次會員 Email。
     */
    @EntityGraph(attributePaths = "member")
    @Query("""
            SELECT o FROM Order o
            WHERE (:keyword = ''
                    OR LOWER(o.orderNo) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.member.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(o.receiverName) LIKE LOWER(CONCAT('%', :keyword, '%')))
                AND (:status IS NULL OR o.status = :status)
                AND (:shippingMethod IS NULL OR o.shippingMethod = :shippingMethod)
            """)
    Page<Order> findByAdminFilter(
            @Param("keyword") String keyword,
            @Param("status") OrderStatus status,
            @Param("shippingMethod") ShippingMethod shippingMethod,
            Pageable pageable
    );

    // 逾時未付款排程用：某個付款方式、還沒付款、在 createdBefore 之前建立的訂單
    List<Order> findByStatusAndPaidAtIsNullAndPaymentMethodAndCreatedAtBefore(
            OrderStatus status, PaymentMethod paymentMethod, LocalDateTime createdBefore);

    /**
     * 綠界建立付款時使用。
     *
     * 依訂單編號鎖定訂單，
     * 避免同一張訂單同時建立多筆付款紀錄。
     *
     * 必須在 @Transactional 中呼叫。
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM Order o
            WHERE o.orderNo = :orderNo
            """)
    Optional<Order> findByOrderNoForUpdate(
            @Param("orderNo") String orderNo
    );

    /**
     * 綠界付款通知時使用。
     *
     * 依訂單 ID 鎖定訂單，
     * 避免不同付款通知同時更新訂單。
     *
     * 必須在 @Transactional 中呼叫。
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM Order o
            WHERE o.id = :orderId
            """)
    Optional<Order> findByIdForUpdate(
            @Param("orderId") Long orderId
    );
}