package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.analytics.ProductSalesResponse;
import com.EEIT25.unicloth.dto.admin.analytics.ProductSalesTrendResponse;
import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.product.SalesTrendDirection;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

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
     * 比較本期與相同長度的上一期，取得商品銷售趨勢。
     */
    @Transactional(readOnly = true)
    public List<ProductSalesTrendResponse> getSalesTrends(
            Integer requestedDays,
            Integer requestedLimit
    ) {
        int days = normalizeDays(requestedDays);
        int limit = normalizeLimit(requestedLimit);
        LocalDateTime currentEndAt = LocalDateTime.now();
        LocalDateTime currentStartAt =
                currentEndAt.minusDays(days);
        LocalDateTime previousStartAt =
                currentStartAt.minusDays(days);

        List<ProductSalesResponse> currentPeriod =
                orderItemRepository
                        .findProductSales(
                                EXCLUDED_STATUSES,
                                currentStartAt,
                                currentEndAt,
                                Pageable.unpaged()
                        );

        List<ProductSalesResponse> previousPeriod =
                orderItemRepository
                        .findProductSales(
                                EXCLUDED_STATUSES,
                                previousStartAt,
                                currentStartAt,
                                Pageable.unpaged()
                        );

        Map<Long, ProductSalesResponse> currentByProductId =
                toProductMap(currentPeriod);

        Map<Long, ProductSalesResponse> previousByProductId =
                toProductMap(previousPeriod);

        // 保留本期熱銷順序，再補上只有上一期有銷量的商品。
        Set<Long> productIds =
                new LinkedHashSet<>();

        currentPeriod.forEach(product ->
                productIds.add(product.productId())
        );

        previousPeriod.forEach(product ->
                productIds.add(product.productId())
        );

        return productIds.stream()
                .map(productId ->
                        toTrendResponse(
                                currentByProductId.get(productId),
                                previousByProductId.get(productId)
                        )
                )
                .limit(limit)
                .toList();
    }

    /**
     * 將銷售清單轉為商品 id 對應資料。
     */
    private Map<Long, ProductSalesResponse> toProductMap(
            List<ProductSalesResponse> sales
    ) {
        return sales.stream()
                .collect(
                        Collectors.toMap(
                                ProductSalesResponse::productId,
                                Function.identity()
                        )
                );
    }

    /**
     * 合併本期與上一期資料並計算變化方向。
     */
    private ProductSalesTrendResponse toTrendResponse(
            ProductSalesResponse current,
            ProductSalesResponse previous
    ) {
        ProductSalesResponse product =
                current != null
                        ? current
                        : previous;

        long currentUnits =
                current == null
                        ? 0L
                        : current.unitsSold();

        long previousUnits =
                previous == null
                        ? 0L
                        : previous.unitsSold();

        long currentRevenue =
                current == null
                        ? 0L
                        : current.revenue();

        long previousRevenue =
                previous == null
                        ? 0L
                        : previous.revenue();

        long unitChange =
                currentUnits - previousUnits;

        Double changePercent =
                calculateChangePercent(
                        currentUnits,
                        previousUnits
                );

        SalesTrendDirection trend =
                determineTrend(
                        currentUnits,
                        previousUnits
                );

        return new ProductSalesTrendResponse(
                product.productId(),
                product.slug(),
                product.name(),
                product.imageUrl(),
                currentUnits,
                previousUnits,
                unitChange,
                changePercent,
                currentRevenue,
                previousRevenue,
                trend
        );
    }

    /**
     * 上一期為零時無法計算百分比，交由 NEW 趨勢表示。
     */
    private Double calculateChangePercent(
            long currentUnits,
            long previousUnits
    ) {
        if (previousUnits == 0L) {
            return null;
        }

        double percent =
                (currentUnits - previousUnits)
                        * 100.0
                        / previousUnits;

        return Math.round(percent * 10.0) / 10.0;
    }

    /**
     * 判斷商品銷量的變化方向。
     */
    private SalesTrendDirection determineTrend(
            long currentUnits,
            long previousUnits
    ) {
        if (previousUnits == 0L && currentUnits > 0L) {
            return SalesTrendDirection.NEW;
        }

        if (currentUnits > previousUnits) {
            return SalesTrendDirection.UP;
        }

        if (currentUnits < previousUnits) {
            return SalesTrendDirection.DOWN;
        }

        return SalesTrendDirection.STABLE;
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