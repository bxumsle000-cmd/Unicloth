package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.product.AdminLowStockResponse;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.product.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminLowStockService {

    private static final int DEFAULT_THRESHOLD = 5;

    private final ProductVariantRepository
            productVariantRepository;

    /**
     * 取得上架中商品的庫存警示。
     *
     * threshold：
     * 庫存小於或等於這個數字時，
     * 會被列入警示。
     */
    @Transactional(readOnly = true)
    public List<AdminLowStockResponse> getWarnings(
            Integer threshold
    ) {
        int normalizedThreshold =
                threshold == null
                        ? DEFAULT_THRESHOLD
                        : threshold;

        if (normalizedThreshold < 0) {
            throw ApiException.badRequest(
                    "庫存警示值不能小於 0"
            );
        }

        List<ProductVariant> warningVariants =
                productVariantRepository
                        .findStockWarnings(
                                ProductStatus.ON_SALE,
                                normalizedThreshold
                        );

        /*
         * Repository 已依商品與庫存排序。
         * LinkedHashMap 可以保留查詢結果的順序。
         */
        Map<Long, List<ProductVariant>>
                variantsByProductId =
                warningVariants.stream()
                        .collect(
                                Collectors.groupingBy(
                                        variant ->
                                                variant
                                                        .getProduct()
                                                        .getId(),
                                        LinkedHashMap::new,
                                        Collectors.toList()
                                )
                        );

        return variantsByProductId
                .values()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * 將同一件商品的警示 SKU
     * 分成缺貨與快賣完兩組。
     */
    private AdminLowStockResponse toResponse(
            List<ProductVariant> variants
    ) {
        Product product =
                variants.getFirst().getProduct();

        List<AdminLowStockResponse.VariantResponse>
                outOfStockVariants =
                variants.stream()
                        .filter(variant ->
                                variant.getStock() == 0
                        )
                        .map(this::toVariantResponse)
                        .toList();

        List<AdminLowStockResponse.VariantResponse>
                lowStockVariants =
                variants.stream()
                        .filter(variant ->
                                variant.getStock() > 0
                        )
                        .map(this::toVariantResponse)
                        .toList();

        return new AdminLowStockResponse(
                product.getId(),
                product.getSlug(),
                product.getName(),
                product.getImageUrl(),
                outOfStockVariants,
                lowStockVariants
        );
    }

    /**
     * SKU Entity 轉成前端資料。
     */
    private AdminLowStockResponse.VariantResponse
    toVariantResponse(
            ProductVariant variant
    ) {
        return new AdminLowStockResponse
                .VariantResponse(
                variant.getId(),
                variant.getSkuCode(),
                variant.getColor(),
                variant.getSize(),
                variant.getStock()
        );
    }
}