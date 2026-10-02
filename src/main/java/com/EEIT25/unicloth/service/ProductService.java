package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.category.ProductCardResponse;
import com.EEIT25.unicloth.dto.product.ProductDetailResponse;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 商品相關服務<br>
 * - {@link #getProductDetail(String)}：商品詳細頁<br>
 * - {@link #getProductsBySearch(String, Pageable)}：用商品名稱搜尋
 */
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    /** 商品詳細頁（只查上架中的）：把所有 SKU 依顏色分組，每個顏色底下帶各尺寸 */
    @Transactional
    public ProductDetailResponse getProductDetail(String slug){
        Product product = productRepository.findOnSaleBySlug(slug)
                .orElseThrow(() -> ApiException.notFound("找不到商品：" + slug));

        List<ProductVariant> productVariantList = productVariantRepository
                                                .findByProductIdOrderByIdAsc(product.getId());

        return ProductDetailResponse.from(product, productVariantList);
    }

    /** 用商品名稱搜尋（不分大小寫、分頁）；關鍵字是空的就回空頁，不會撈出全部商品 */
    @Transactional
    public Page<ProductCardResponse> getProductsBySearch(String keyword, Pageable pageable) {
        String kw = keyword.trim();
        if (kw.isEmpty()) {
            return Page.empty(pageable);
        }
        return productRepository.findByStatusAndNameContainingIgnoreCase(ProductStatus.ON_SALE, kw, pageable)
                .map(ProductCardResponse::from);
    }
}

