package com.EEIT25.unicloth.service.shop;

import com.EEIT25.unicloth.dto.admin.analytics.ProductSalesResponse;
import com.EEIT25.unicloth.dto.store.category.ProductCardResponse;
import com.EEIT25.unicloth.dto.store.style.StyleResponse;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.product.ProductStatus;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 依會員瀏覽偏好或近 30 天銷量提供商品推薦。
 * 所有推薦商品都必須至少有一個 SKU 尚有庫存。
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {
    private static final int DEFAULT_LIMIT = 12;
    private static final int MAX_LIMIT = 24;

    // 近 30 天累積售出 5 件以上，前台自動顯示 HOT。
    private static final long AUTO_HOT_MIN_UNITS = 5L;
    private static final int SALES_LOOKBACK_DAYS = 30;

    // 未付款、已取消訂單不算有效銷量。
    private static final Set<OrderStatus> EXCLUDED_SALES_STATUSES =
            Set.of(
                    OrderStatus.UNPAID,
                    OrderStatus.CANCELLED
            );

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderItemRepository orderItemRepository;
    private final CurrentMember currentMember;

    /**
     * 已登入且有偏好資料時，以偏好優先。
     * 訪客或沒有偏好資料時，則以近 30 天銷量由高到低推薦。
     */
    @Transactional(readOnly = true)
    public List<ProductCardResponse> getRecommendations(
            Integer requestedLimit
    ) {
        int limit = normalizeLimit(requestedLimit);
        List<ProductSalesResponse> recentSales =
                getRecentSalesRanking();
        Map<Long, Long> unitsSoldByProductId =
                recentSales.stream()
                        .collect(
                                Collectors.toMap(
                                        ProductSalesResponse::productId,
                                        ProductSalesResponse::unitsSold
                                )
                        );

        Long memberId = currentMember.getCurrentIdOrNull();
        List<Product> products;

        if (memberId == null) {
            products = getSalesRankedProducts(
                    recentSales,
                    limit
            );
        } else {
            // 個人化推薦也先排除已售罄商品。
            products = filterProductsWithAvailableStock(
                    getPersonalizedProducts(
                            memberId,
                            limit
                    )
            );

            /*
             * 偏好推薦不足 12 件時，用銷量與人工 HOT 商品補足。
             * mergeProducts 會自動略過重複商品。
             */
            if (products.size() < limit) {
                products = mergeProducts(
                        products,
                        getSalesRankedProducts(
                                recentSales,
                                limit
                        ),
                        limit
                );
            }
        }

        return products.stream()
                .map(product -> toCardResponse(
                        product,
                        unitsSoldByProductId
                ))
                .toList();
    }

    /**
     * 查詢近 30 天所有有效訂單的商品銷量。
     * 查詢結果已依售出件數、銷售金額排序。
     */
    private List<ProductSalesResponse> getRecentSalesRanking() {
        LocalDateTime endAt = LocalDateTime.now();
        LocalDateTime startAt =
                endAt.minusDays(SALES_LOOKBACK_DAYS);

        return orderItemRepository.findProductSales(
                EXCLUDED_SALES_STATUSES,
                startAt,
                endAt,
                Pageable.unpaged()
        );
    }

    /**
     * 所有有銷量且有庫存的上架商品優先。
     * 後面再補入人工 HOT 與一般上架商品。
     */
    private List<Product> getSalesRankedProducts(
            List<ProductSalesResponse> recentSales,
            int limit
    ) {
        List<Long> salesRankedProductIds =
                recentSales.stream()
                        .map(ProductSalesResponse::productId)
                        .toList();

        Map<Long, Product> onSaleProductsById =
                productRepository.findAllById(salesRankedProductIds)
                        .stream()
                        .filter(product ->
                                product.getStatus()
                                        == ProductStatus.ON_SALE
                        )
                        .collect(
                                Collectors.toMap(
                                        Product::getId,
                                        Function.identity()
                                )
                        );

        Set<Long> availableProductIds =
                getAvailableProductIds(
                        onSaleProductsById.keySet()
                );

        List<Product> products = new ArrayList<>();
        Set<Long> selectedProductIds = new LinkedHashSet<>();

        // 第一順位：有有效銷量且有庫存的商品，按照銷量排行。
        for (Long productId : salesRankedProductIds) {
            Product product = onSaleProductsById.get(productId);

            if (product == null
                    || !availableProductIds.contains(productId)) {
                continue;
            }

            addProductIfAvailable(
                    products,
                    selectedProductIds,
                    product,
                    limit
            );
        }

        /*
         * 第二順位：人工 HOT 與一般上架商品。
         * 分頁逐頁查詢，避免前面剛好都是售罄商品時無法補足。
         */
        int page = 0;

        while (products.size() < limit) {
            Page<Product> fallbackPage =
                    productRepository
                            .findByStatusAndNameContainingIgnoreCase(
                                    ProductStatus.ON_SALE,
                                    "",
                                    PageRequest.of(
                                            page,
                                            limit,
                                            Sort.by(
                                                    Sort.Order.desc("hot"),
                                                    Sort.Order.desc("id")
                                            )
                                    )
                            );

            List<Product> availableFallbackProducts =
                    filterProductsWithAvailableStock(
                            fallbackPage.getContent()
                    );

            for (Product product : availableFallbackProducts) {
                addProductIfAvailable(
                        products,
                        selectedProductIds,
                        product,
                        limit
                );
            }

            if (!fallbackPage.hasNext()) {
                break;
            }

            page++;
        }

        return products;
    }

    /**
     * 依會員瀏覽風格提供個人化推薦。
     * 庫存過濾會在呼叫此方法後統一處理。
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
                                        Function.identity()
                                )
                        );

        // findAllById 不保證順序，因此依偏好查詢回傳的順序還原。
        return productIds.stream()
                .map(productsById::get)
                .filter(Objects::nonNull)
                .toList();
    }

    /**
     * 只保留至少一個 SKU 庫存大於 0 的商品。
     * 一次查詢整批 SKU，避免每件商品各查一次資料庫。
     */
    private List<Product> filterProductsWithAvailableStock(
            List<Product> products
    ) {
        if (products.isEmpty()) {
            return List.of();
        }

        Set<Long> availableProductIds =
                getAvailableProductIds(
                        products.stream()
                                .map(Product::getId)
                                .toList()
                );

        return products.stream()
                .filter(product ->
                        availableProductIds.contains(
                                product.getId()
                        )
                )
                .toList();
    }

    /**
     * 找出清單中至少有一個 SKU 尚有庫存的商品 id。
     */
    private Set<Long> getAvailableProductIds(
            Collection<Long> productIds
    ) {
        if (productIds.isEmpty()) {
            return Set.of();
        }

        return productVariantRepository
                .findByProductIdInOrderByIdAsc(productIds)
                .stream()
                .filter(variant ->
                        variant.getStock() != null
                                && variant.getStock() > 0
                )
                .map(variant ->
                        variant.getProduct().getId()
                )
                .collect(Collectors.toSet());
    }

    /**
     * 將補充商品加入清單，同一商品只會出現一次。
     */
    private List<Product> mergeProducts(
            List<Product> primaryProducts,
            List<Product> fallbackProducts,
            int limit
    ) {
        List<Product> mergedProducts =
                new ArrayList<>(primaryProducts);
        Set<Long> selectedProductIds =
                primaryProducts.stream()
                        .map(Product::getId)
                        .collect(
                                Collectors.toCollection(
                                        LinkedHashSet::new
                                )
                        );

        for (Product product : fallbackProducts) {
            addProductIfAvailable(
                    mergedProducts,
                    selectedProductIds,
                    product,
                    limit
            );
        }

        return mergedProducts;
    }

    /**
     * 同一商品只加入一次，且不超過前端要求的商品數量。
     */
    private void addProductIfAvailable(
            List<Product> products,
            Set<Long> selectedProductIds,
            Product product,
            int limit
    ) {
        if (products.size() >= limit
                || !selectedProductIds.add(product.getId())) {
            return;
        }

        products.add(product);
    }

    /**
     * 手動 HOT 或近 30 天售出至少 5 件，就顯示 HOT。
     * 只改 API 回傳，不會回寫資料庫，避免覆蓋人工設定。
     */
    private ProductCardResponse toCardResponse(
            Product product,
            Map<Long, Long> unitsSoldByProductId
    ) {
        long unitsSold =
                unitsSoldByProductId.getOrDefault(
                        product.getId(),
                        0L
                );

        boolean autoHot = unitsSold >= AUTO_HOT_MIN_UNITS;

        return new ProductCardResponse(
                product.getSlug(),
                product.getName(),
                product.getPrice(),
                product.getOrigPrice(),
                product.isNewArrival(),
                product.isHot() || autoHot,
                product.getImageUrl(),
                product.getStyles()
                        .stream()
                        .map(StyleResponse::from)
                        .toList()
        );
    }

    /**
     * 推薦頁最多顯示 24 件，避免一次讀取過多資料。
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