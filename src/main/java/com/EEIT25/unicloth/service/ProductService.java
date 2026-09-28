package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.category.ProductCardResponse;
import com.EEIT25.unicloth.dto.product.ProductDetailResponse;
import com.EEIT25.unicloth.dto.product.ProductDetailResponse.ColorOption;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {
    private static final String ON_SALE = "on_sale";

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    @Transactional
    public ProductDetailResponse getProductDetail(String slug){
        Product product = productRepository.findOnSaleBySlug(slug)
                .orElseThrow(() -> ApiException.notFound("找不到商品：" + slug));

        List<ProductVariant> productVariantList = productVariantRepository
                                                .findByProductIdOrderByIdAsc(product.getId());

        Map<String, List<ProductVariant>> colorMap = new LinkedHashMap<>();
        for (ProductVariant v : productVariantList) {
            colorMap.computeIfAbsent(v.getColor(), k -> new ArrayList<>()).add(v);
        }

        // 每個顏色的 SKU 轉成一個 ColorOption，底下帶各尺寸
        List<ColorOption> colors = new ArrayList<>();
        for (Map.Entry<String, List<ProductVariant>> entry : colorMap.entrySet()) {
            colors.add(ColorOption.from(entry.getKey(), entry.getValue()));
        }

        return ProductDetailResponse.from(product,colors);
    }

    /** 用商品名稱搜尋（不分大小寫、分頁）；關鍵字是空的就回空頁，不會撈出全部商品 */
    @Transactional
    public Page<ProductCardResponse> getProductsBySearch(String keyword, Pageable pageable) {
        String kw = keyword.trim();
        if (kw.isEmpty()) {
            return Page.empty(pageable);
        }
        return productRepository.findByStatusAndNameContainingIgnoreCase(ON_SALE, kw, pageable)
                .map(ProductCardResponse::from);
    }
}

