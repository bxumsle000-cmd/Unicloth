package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.CategoryDetailResponse;
import com.EEIT25.unicloth.dto.CategoryResponse;
import com.EEIT25.unicloth.dto.ProductCardResponse;
import com.EEIT25.unicloth.entity.Category;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CategoryRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 分類篩選相關服務<br>
 * 分類三層：性別（男裝）› 大類（T恤/背心）› 細類（長袖），商品只掛在第 3 層。<br>
 * - {@link #getMenu()}：導覽選單，第 1 層 + 各自的第 2 層<br>
 * - {@link #getCategory(String)}：分類頁上方資訊（麵包屑 + 下一層篩選按鈕）<br>
 * - {@link #getProducts(String, Pageable)}：第 2 層或第 3 層分類的商品，分頁
 */
@Service
@RequiredArgsConstructor
public class CategoryService {
    private static final String ON_SALE = "on_sale";

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    /** 點「男裝」時展開的選單：第 1 層，每個底下帶第 2 層 */
    @Transactional
    public List<CategoryResponse> getMenu() {
        List<Category> category = categoryRepository.findByParentIsNullOrderByIdAsc();
        return category.stream()
                .map(top -> {
                    List<CategoryResponse> children = categoryRepository.findByParentOrderByIdAsc(top)
                            .stream().map(CategoryResponse::from).toList();
                    return CategoryResponse.from(top, children);
                })
                .toList();
    }

    /** 進入分類頁時，上方的麵包屑與下一層篩選按鈕 */
    @Transactional
    public CategoryDetailResponse getCategory(String code) {
        Category category = categoryRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("找不到分類：" + code));

        // 麵包屑：從自己一路往 parent 爬，再倒過來 → [男裝, T恤/背心]
        List<CategoryResponse> breadcrumb = new ArrayList<>();
        for (Category c = category; c != null; c = c.getParent()) {
            breadcrumb.add(0, CategoryResponse.from(c));
        }

        List<CategoryResponse> children = categoryRepository.findByParentOrderByIdAsc(category)
                .stream().map(CategoryResponse::from).toList();

        return new CategoryDetailResponse(category.getCode(), category.getName(), breadcrumb, children);
    }

    /**
     * 某分類的商品（分頁）。<br>
     * 傳第 2 層 code → 底下所有第 3 層的商品；傳第 3 層 code → 只有那一層的商品。
     */
    @Transactional
    public Page<ProductCardResponse> getProducts(String code, Pageable pageable) {
        Category category = categoryRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("找不到分類：" + code));

        // 商品只掛在第 3 層：有子分類（第 2 層）就用子分類的 id，沒有（第 3 層）就用自己的 id
        List<Category> children = categoryRepository.findByParentOrderByIdAsc(category);
        List<Long> categoryIds = children.isEmpty()
                ? List.of(category.getId())
                : children.stream().map(Category::getId).toList();

        Page<Product> products = productRepository.findByCategoryIdInAndStatus(categoryIds, ON_SALE, pageable);

        // 一次撈出這一頁所有商品的 SKU，每件商品取第一個 SKU 的圖當縮圖
        List<Long> productIds = products.map(Product::getId).getContent();
        Map<Long, String> imageByProductId = new HashMap<>();

        for (ProductVariant v : variantRepository.findByProductIdInOrderByIdAsc(productIds)) {
            imageByProductId.putIfAbsent(v.getProduct().getId(), v.getUrl());
        }

        return products.map(p -> ProductCardResponse.from(p, imageByProductId.get(p.getId())));
    }
}
