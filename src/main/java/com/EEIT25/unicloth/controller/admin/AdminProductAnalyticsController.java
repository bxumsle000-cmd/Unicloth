package com.EEIT25.unicloth.controller.admin;

import com.EEIT25.unicloth.dto.admin.analytics.ProductSalesTrendResponse;
import com.EEIT25.unicloth.service.admin.ProductSalesAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/**
 * 提供商品部門查看銷售趨勢。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/product/analytics")
public class AdminProductAnalyticsController {
    private final ProductSalesAnalyticsService analyticsService;

    /**
     * 比較指定期間與上一個相同期間的商品銷售趨勢。
     */
    @GetMapping("/trends")
    public List<ProductSalesTrendResponse> getSalesTrends(
            @RequestParam(defaultValue = "30")
            Integer days,
            @RequestParam(defaultValue = "10")
            Integer limit
    ) {
        return analyticsService
                .getSalesTrends(
                        days,
                        limit
                );
    }
}