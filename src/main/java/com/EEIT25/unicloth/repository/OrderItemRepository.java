package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // 一張訂單的所有明細（明細本身就是快照，不需要再 JOIN 商品）
    List<OrderItem> findByOrderId(Long orderId);
}
