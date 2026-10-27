package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.category.ProductCardResponse;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 依會員瀏覽偏好提供商品推薦。
 * 訪客或尚無偏好資料時，改為提供熱門商品。
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {
    private static final int DEFAULT_LIMIT = 12;
    private static final int MAX_LIMIT = 24;

    private final ProductRepository productRepository;
    private final CurrentMember currentMember;

    /**
     * 登入且有偏好資料時依累積風格分數推薦，其他情況回傳熱門商品。
     */
    @Transactional(readOnly = true)
    public List<ProductCardResponse> getRecommendations(
            Integer requestedLimit
    ) {
        int limit = normalizeLimit(requestedLimit);
        Long memberId = currentMember.getCurrentIdOrNull();
        List<Product> products;

        // 訪客沒有會員偏好，直接顯示熱門商品。
        if (memberId == null) {
            products = getPopularProducts(limit);
        } else {
            products = getPersonalizedProducts(
                    memberId,
                    limit
            );

            // 尚無偏好或沒有相符的未瀏覽商品時，改用熱門商品。
            if (products.isEmpty()) {
                products = getPopularProducts(limit);
            }
        }

        return products.stream()
                .map(ProductCardResponse::from)
                .toList();
    }

    /**
     * 依加權後的商品 id 順序取得個人化推薦。
     */
    private List<Product> getPersonalizedProducts(
            Long memberId,
            int limit
    ) {
        List<Long> productIds =
                productRepository
                        .findRecommendationProductIds(
                                memberId,
                                PageRequest.of(0, limit)
                        );

        if (productIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Product> productsById =
                productRepository
                        .findAllById(productIds)
                        .stream()
                        .collect(
                                Collectors.toMap(
                                        Product::getId,
                                        product -> product
                                )
                        );

        // findAllById 不保證順序，因此依加權查詢的 id 順序重新排列。
        return productIds.stream()
                .map(productsById::get)
                .filter(Objects::nonNull)
                .toList();
    }

    /**
     * 使用商品既有的熱門標記作為訪客或尚無偏好時的推薦。
     */
    private List<Product> getPopularProducts(
            int limit
    ) {
        return productRepository
                .findByStatusAndNameContainingIgnoreCase(
                        ProductStatus.ON_SALE,
                        "",
                        PageRequest.of(
                                0,
                                limit,
                                Sort.by(
                                        Sort.Order.desc("hot"),
                                        Sort.Order.desc("id")
                                )
                        )
                )
                .getContent();
    }

    /**
     * 限制單次推薦數量，避免一次載入過多商品。
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