package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.admin.product.BatchUpdateProductCategoryRequest;
import com.EEIT25.unicloth.dto.admin.product.BatchUpdateProductStatusRequest;
import com.EEIT25.unicloth.entity.Category;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CategoryRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminProductBatchService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public void updateStatuses(
            BatchUpdateProductStatusRequest request
    ) {
        List<Product> products = findSelectedProducts(
                request.productIds()
        );

        if (request.status() == ProductStatus.ON_SALE) {
            validateCanPublish(products);
        }

        for (Product product : products) {
            product.setStatus(request.status());
        }
    }

    @Transactional
    public void updateCategories(
            BatchUpdateProductCategoryRequest request
    ) {
        List<Product> products = findSelectedProducts(
                request.productIds()
        );

        Category category = categoryRepository
                .findById(request.categoryId())
                .orElseThrow(() ->
                        ApiException.notFound(
                                "找不到分類：" + request.categoryId()
                        )
                );

        boolean hasChildren = !categoryRepository
                .findByParentOrderByIdAsc(category)
                .isEmpty();

        if (hasChildren) {
            throw ApiException.badRequest(
                    "只能移動到最底層分類：" + category.getName()
            );
        }

        for (Product product : products) {
            product.setCategory(category);
        }
    }

    private List<Product> findSelectedProducts(
            List<Long> productIds
    ) {
        Set<Long> uniqueProductIds = new LinkedHashSet<>(
                productIds
        );

        if (uniqueProductIds.size() != productIds.size()) {
            throw ApiException.badRequest(
                    "選取的商品中有重複項目"
            );
        }

        List<Product> products = productRepository
                .findAllById(uniqueProductIds);

        if (products.size() != uniqueProductIds.size()) {
            Set<Long> foundIds = products.stream()
                    .map(Product::getId)
                    .collect(Collectors.toSet());

            String missingIds = uniqueProductIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .map(String::valueOf)
                    .collect(Collectors.joining("、"));

            throw ApiException.notFound(
                    "找不到商品：" + missingIds
            );
        }

        return products;
    }

    private void validateCanPublish(
            List<Product> products
    ) {
        Set<Long> productIds = products.stream()
                .map(Product::getId)
                .collect(Collectors.toSet());

        Map<Long, Integer> stockByProductId =
                productVariantRepository
                        .findByProductIdInOrderByIdAsc(productIds)
                        .stream()
                        .collect(Collectors.groupingBy(
                                variant -> variant.getProduct().getId(),
                                Collectors.summingInt(
                                        ProductVariant::getStock
                                )
                        ));

        List<Product> blockedProducts = products.stream()
                .filter(product ->
                        stockByProductId.getOrDefault(
                                product.getId(),
                                0
                        ) <= 0
                )
                .toList();

        if (!blockedProducts.isEmpty()) {
            String names = blockedProducts.stream()
                    .map(Product::getName)
                    .collect(Collectors.joining("、"));

            throw ApiException.badRequest(
                    "以下商品沒有庫存，不能上架：" + names
            );
        }
    }
}