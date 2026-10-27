package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.category.ProductCardResponse;
import com.EEIT25.unicloth.dto.product.ProductDetailResponse;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.entity.Style;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.repository.StyleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 處理前台商品查詢。
 */
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductVariantRepository
            productVariantRepository;
    private final StyleRepository styleRepository;

    /**
     * 取得上架中的商品詳細資料。
     */
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetail(
            String slug
    ) {
        Product product =
                productRepository.findOnSaleBySlug(slug)
                        .orElseThrow(() ->
                                ApiException.notFound(
                                        "找不到商品：" + slug
                                )
                        );

        List<ProductVariant> variants =
                productVariantRepository
                        .findByProductIdOrderByIdAsc(
                                product.getId()
                        );

        return ProductDetailResponse.from(
                product,
                variants
        );
    }

    /**
     * 使用商品名稱、直接風格或相關風格搜尋商品。
     */
    @Transactional(readOnly = true)
    public Page<ProductCardResponse> getProductsBySearch(
            String keyword,
            Pageable pageable
    ) {
        String normalizedKeyword =
                keyword == null
                        ? ""
                        : keyword.trim();

        // 空白關鍵字不查詢全部商品
        if (normalizedKeyword.isEmpty()) {
            return Page.empty(pageable);
        }

        // 找出正式名稱、代碼或別名符合的風格
        Set<Long> directStyleIds =
                styleRepository
                        .findMatchingStyles(
                                normalizedKeyword
                        )
                        .stream()
                        .map(Style::getId)
                        .collect(Collectors.toSet());

        // 根據直接風格取得相關風格
        Set<Long> relatedStyleIds =
                new HashSet<>();

        if (!directStyleIds.isEmpty()) {
            relatedStyleIds.addAll(
                    styleRepository
                            .findRelatedStyles(
                                    directStyleIds
                            )
                            .stream()
                            .map(Style::getId)
                            .toList()
            );
        }

        // 直接符合的風格不需要重複出現在相關風格
        relatedStyleIds.removeAll(directStyleIds);

        boolean hasDirectStyles =
                !directStyleIds.isEmpty();

        boolean hasRelatedStyles =
                !relatedStyleIds.isEmpty();

        // 避免產生空的 SQL IN 條件
        Set<Long> directQueryIds =
                hasDirectStyles
                        ? directStyleIds
                        : Set.of(-1L);

        Set<Long> relatedQueryIds =
                hasRelatedStyles
                        ? relatedStyleIds
                        : Set.of(-1L);

        return productRepository
                .findByKeywordAndStyleGroups(
                        ProductStatus.ON_SALE,
                        normalizedKeyword,
                        hasDirectStyles,
                        directQueryIds,
                        hasRelatedStyles,
                        relatedQueryIds,
                        pageable
                )
                .map(ProductCardResponse::from);
    }
}