
package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Payment;
import com.EEIT25.unicloth.enums.PaymentStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 綠界金流付款紀錄 Repository
 */
public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    /**
     * 透過綠界商店交易編號查詢付款紀錄。
     * 接收綠界付款通知時使用。
     */
    Optional<Payment> findByMerchantTradeNo(
            String merchantTradeNo
    );

    /**
     * 檢查商店交易編號是否已存在。
     * 避免重複建立相同交易編號。
     */
    boolean existsByMerchantTradeNo(
            String merchantTradeNo
    );

    /**
     * 查詢某張訂單的所有付款紀錄。
     */
    List<Payment> findByOrderIdOrderByCreatedAtDesc(
            Long orderId
    );

    /**
     * 查詢某張訂單指定狀態的付款紀錄。
     */
    List<Payment> findByOrderIdAndStatus(
            Long orderId,
            PaymentStatus status
    );
    /**
 * 付款通知專用：
 * 鎖定付款紀錄，避免同一筆通知同時處理。
 *
 * 必須在 @Transactional 交易中呼叫。
 */
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("""
        SELECT p
        FROM Payment p
        WHERE p.merchantTradeNo = :tradeNo
        """)
Optional<Payment> findByMerchantTradeNoForUpdate(
        @Param("tradeNo") String tradeNo
);
}
