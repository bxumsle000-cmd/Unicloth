package com.EEIT25.unicloth.service.shop;

import com.EEIT25.unicloth.service.MemberProductViewService;
import com.EEIT25.unicloth.dto.store.category.ProductCardResponse;
import com.EEIT25.unicloth.dto.store.product.ProductDetailResponse;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.entity.Style;
import com.EEIT25.unicloth.enums.product.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.repository.StyleRepository;
import com.EEIT25.unicloth.security.CurrentMember;
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
 * 商品相關服務<br>
 * - {@link #getProductDetail(String)}：商品詳細頁，登入會員同時記錄瀏覽<br>
 * - {@link #getNewArrivals(Pageable)}：查詢目前上架的新品<br>
 * - {@link #getProductsBySearch(String, Pageable)}：用商品名稱、直接風格與相關風格搜尋
 */
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final StyleRepository styleRepository;
    private final CurrentMember currentMember;
    private final MemberProductViewService memberProductViewService;

    /**
     * 商品詳細頁（只查上架中的）：
     * 把所有 SKU 依顏色分組，每個顏色底下帶各尺寸；
     * 登入會員瀏覽時同時記錄商品偏好。
     */
    @Transactional
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

        // 未登入時 memberId 為 null，不會建立瀏覽紀錄。
        memberProductViewService.recordView(
                currentMember.getCurrentIdOrNull(),
                product
        );

        return ProductDetailResponse.from(
                product,
                variants
        );
    }

    /**
     * 查詢目前上架且標示為新品的商品。
     */
    @Transactional(readOnly = true)
    public Page<ProductCardResponse> getNewArrivals(
            Pageable pageable
    ) {
        return productRepository
                .findByStatusAndNewArrivalTrue(
                        ProductStatus.ON_SALE,
                        pageable
                )
                .map(ProductCardResponse::from);
    }

    /**
     * 用商品名稱、直接風格與相關風格搜尋（不分大小寫、分頁）。
     * 關鍵字是空的就回空頁，不會撈出全部商品。
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

        // 空白關鍵字不查詢全部商品。
        if (normalizedKeyword.isEmpty()) {
            return Page.empty(pageable);
        }

        // 找出正式名稱、代碼或別名符合的風格。
        Set<Long> directStyleIds =
                styleRepository
                        .findMatchingStyles(
                                normalizedKeyword
                        )
                        .stream()
                        .map(Style::getId)
                        .collect(Collectors.toSet());

        // 根據直接風格取得相關風格。
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

        // 直接符合的風格不需要重複出現在相關風格。
        relatedStyleIds.removeAll(directStyleIds);

        boolean hasDirectStyles =
                !directStyleIds.isEmpty();

        boolean hasRelatedStyles =
                !relatedStyleIds.isEmpty();

        // 避免產生空的 SQL IN 條件。
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