package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.InventoryTransactionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface InventoryTransactionItemRepository
        extends JpaRepository<
        InventoryTransactionItem,
        Long
        > {

    /**
     * 一次查出多筆庫存異動主紀錄的所有明細。
     *
     * 歷史列表可以先查一頁主紀錄，
     * 再用這個方法一次取得該頁全部明細，
     * 避免每筆主紀錄各查一次資料庫。
     */
    List<InventoryTransactionItem>
    findByTransactionIdInOrderByIdAsc(
            Collection<Long> transactionIds
    );
}