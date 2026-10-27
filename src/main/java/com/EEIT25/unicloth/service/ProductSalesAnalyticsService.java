package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.analytics.ProductSalesResponse;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * 計算商品熱銷排行與銷售表現。
 */
@Service
@RequiredArgsConstructor
public class ProductSalesAnalyticsService {
    private static final int DEFAULT_DAYS = 30;
    private static final int MAX_DAYS = 365;
    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 100;

    private static final Set<OrderStatus> EXCLUDED_STATUSES =
            Set.of(
                    OrderStatus.UNPAID,
                    OrderStatus.CANCELLED
            );

    private final OrderItemRepository orderItemRepository;

    /**
     * 依指定天數取得熱銷商品排行。
     */
    @Transactional(readOnly = true)
    public List<ProductSalesResponse> getBestSellers(
            Integer requestedDays,
            Integer requestedLimit
    ) {
        int days = normalizeDays(requestedDays);
        int limit = normalizeLimit(requestedLimit);
        LocalDateTime endAt = LocalDateTime.now();
        LocalDateTime startAt = endAt.minusDays(days);

        return orderItemRepository
                .findProductSales(
                        EXCLUDED_STATUSES,
                        startAt,
                        endAt,
                        PageRequest.of(0, limit)
                );
    }

    /**
     * 統計天數限制為 1 到 365 天。
     */
    private int normalizeDays(
            Integer requestedDays
    ) {
        if (requestedDays == null) {
            return DEFAULT_DAYS;
        }

        return Math.min(
                Math.max(requestedDays, 1),
                MAX_DAYS
        );
    }

    /**
     * 排行數量限制為 1 到 100 件商品。
     */
    private int normalizeLimit(
            Integer requestedLimit
    ) {
        if (requestedLimit == null) {
            return DEFAULT_LIMIT;
        }

        return Math.min(
                Math.max(requestedLimit, 1),
                MAX_LIMIT
        );
    }
}