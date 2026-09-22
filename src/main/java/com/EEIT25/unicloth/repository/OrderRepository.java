package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

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

    // 後台依狀態篩選（pending / shipped / ... / cancelled）
    List<Order> findByStatusOrderByCreatedAtDesc(String status);
}
