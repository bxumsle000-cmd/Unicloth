package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.analytics.ProductSalesResponse;
import com.EEIT25.unicloth.service.ProductSalesAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/**
 * 提供商品部門查看熱銷統計。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/product/analytics")
public class AdminProductAnalyticsController {
    private final ProductSalesAnalyticsService analyticsService;

    /**
     * 取得指定期間內的商品熱銷排行。
     */
    @GetMapping("/best-sellers")
    public List<ProductSalesResponse> getBestSellers(
            @RequestParam(defaultValue = "30")
            Integer days,
            @RequestParam(defaultValue = "10")
            Integer limit
    ) {
        return analyticsService
                .getBestSellers(
                        days,
                        limit
                );
    }
}