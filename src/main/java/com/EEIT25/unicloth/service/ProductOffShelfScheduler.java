package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 商品預定下架排程。
 *
 * 將已到 scheduledOffAt 的上架商品自動改為下架。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProductOffShelfScheduler {

    private final ProductRepository productRepository;

    /**
     * 啟動後一分鐘開始執行，之後每分鐘檢查一次。
     *
     * fixedDelay 代表上一次執行結束後，
     * 再等一分鐘才進行下一次檢查。
     */
    @Scheduled(
            initialDelay = 60_000,
            fixedDelay = 60_000
    )
    @Transactional
    public void offShelfDueProducts() {
        LocalDateTime now = LocalDateTime.now();

        int affectedCount =
                productRepository.offShelfDueProducts(
                        now,
                        ProductStatus.ON_SALE,
                        ProductStatus.OFF_SHELF
                );

        if (affectedCount > 0) {
            log.info(
                    "[product-schedule] 已自動下架 {} 件商品",
                    affectedCount
            );
        }
    }
}