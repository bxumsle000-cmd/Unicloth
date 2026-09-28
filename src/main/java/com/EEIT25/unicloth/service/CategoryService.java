package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.category.BreadcrumbResponse;
import com.EEIT25.unicloth.dto.category.CategoryDetailResponse;
import com.EEIT25.unicloth.dto.category.CategoryResponse;
import com.EEIT25.unicloth.dto.category.FilterOptionsResponse;
import com.EEIT25.unicloth.dto.category.ProductCardResponse;
import com.EEIT25.unicloth.dto.category.ProductFilterRequest;
import com.EEIT25.unicloth.entity.Category;
import com.EEIT25.unicloth.entity.Product;
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
import java.util.List;

/**
 * 分類篩選相關服務<br>
 * 分類三層：性別（男裝）› 大類（T恤/背心）› 細類（長袖），商品只掛在第 3 層。<br>
 * - {@link #getMenu()}：導覽選單，第 1 層 + 各自的第 2 層<br>
 * - {@link #getCategory(String)}：分類頁上方的下一層篩選按鈕<br>
 * - {@link #getBreadcrumb(String)}：分類頁上方的麵包屑<br>
 * - {@link #getProducts(String, ProductFilterRequest, Pageable)}：第 2 層或第 3 層分類的商品，可篩選顏色 / 尺寸 / 價格，分頁<br>
 * - {@link #getFilterOptions(String)}：分類頁的篩選選項（顏色、尺寸、價格範圍）
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

    /** 進入分類頁時，上方的下一層篩選按鈕 */
    @Transactional
    public CategoryDetailResponse getCategory(String code) {
        Category category = categoryRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("找不到分類：" + code));

        List<CategoryResponse> children = categoryRepository.findByParentOrderByIdAsc(category)
                .stream().map(CategoryResponse::from).toList();

        return new CategoryDetailResponse(category.getCode(), category.getName(), children);
    }

    /** 分類頁上方的麵包屑，從第 1 層排到自己 → [男裝, T恤/背心, 長袖] */
    @Transactional
    public List<BreadcrumbResponse> getBreadcrumb(String code) {
        Category category = categoryRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("找不到分類：" + code));

        // 從自己一路往 parent 爬，每次插到最前面 → 順序就是由上到下
        List<BreadcrumbResponse> breadcrumb = new ArrayList<>();
        for (Category c = category; c != null; c = c.getParent()) {
            breadcrumb.add(0, BreadcrumbResponse.from(c));
        }
        return breadcrumb;
    }

    /**
     * 某分類的商品（分頁），可加篩選條件。<br>
     * 傳第 2 層 code → 底下所有第 3 層的商品；傳第 3 層 code → 只有那一層的商品。<br>
     * filter 裡沒填的條件就不篩（全部沒填 = 不篩）。
     */
    @Transactional
    public Page<ProductCardResponse> getProducts(String code, ProductFilterRequest filter, Pageable pageable) {
        List<Long> categoryIds = findLeafCategoryIds(code);

        boolean allColors = filter.colors() == null || filter.colors().isEmpty();   // 沒選顏色 = 全部顏色都可以
        boolean allSizes = filter.sizes() == null || filter.sizes().isEmpty();
        // IN 的清單不能是空的，沒選時放一個佔位值；all* = true 時查詢不會用到它
        List<String> colors = allColors ? List.of("") : filter.colors();
        List<String> sizes = allSizes ? List.of("") : filter.sizes();

        Page<Product> products = productRepository.findByFilter(
                categoryIds, ON_SALE,
                filter.minPrice(), filter.maxPrice(),
                !(allColors && allSizes),
                allColors, colors,
                allSizes, sizes,
                pageable);
        return products.map(ProductCardResponse::from);
    }

    /**
     * 分類頁的篩選選項：這個分類底下上架中的商品，實際有哪些顏色、尺寸、價格範圍。<br>
     * 範圍跟 {@link #getProducts(String, ProductFilterRequest, Pageable)} 一樣（第 2 層 = 底下所有第 3 層）。
     */
    @Transactional
    public FilterOptionsResponse getFilterOptions(String code) {
        List<Long> categoryIds = findLeafCategoryIds(code);

        return new FilterOptionsResponse(
                variantRepository.findDistinctColors(categoryIds, ON_SALE),
                variantRepository.findDistinctSizes(categoryIds, ON_SALE),
                productRepository.findMinPrice(categoryIds, ON_SALE),
                productRepository.findMaxPrice(categoryIds, ON_SALE));
    }

    /**
     * code → 商品實際掛的第 3 層分類 id。<br>
     * 商品只掛在第 3 層：有子分類（第 2 層）就用子分類的 id，沒有（第 3 層）就用自己的 id
     */
    private List<Long> findLeafCategoryIds(String code) {
        Category category = categoryRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("找不到分類：" + code));

        List<Category> children = categoryRepository.findByParentOrderByIdAsc(category);
        return children.isEmpty()
                ? List.of(category.getId())
                : children.stream().map(Category::getId).toList();
    }
}
