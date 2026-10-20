package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryTransactionRepository
        extends JpaRepository<
        InventoryTransaction,
        Long
        > {

    /**
     * 分頁查詢庫存異動紀錄。
     *
     * 同時載入操作員工，避免每筆紀錄再查一次 staff。
     * 排序方式由 Pageable 傳入。
     */
    @Override
    @EntityGraph(attributePaths = "staff")
    Page<InventoryTransaction> findAll(
            Pageable pageable
    );
}