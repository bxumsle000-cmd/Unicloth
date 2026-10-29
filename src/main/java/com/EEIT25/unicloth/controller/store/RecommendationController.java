package com.EEIT25.unicloth.controller.store;

import com.EEIT25.unicloth.dto.store.category.ProductCardResponse;
import com.EEIT25.unicloth.service.shop.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/**
 * 提供訪客熱門商品與登入會員的個人化推薦。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService recommendationService;

    /**
     * 訪客取得熱門商品，登入會員則優先取得個人化推薦。
     */
    @GetMapping
    public List<ProductCardResponse> getRecommendations(
            @RequestParam(defaultValue = "12")
            Integer limit
    ) {
        return recommendationService
                .getRecommendations(limit);
    }
}