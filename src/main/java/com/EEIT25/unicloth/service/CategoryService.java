package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.category.BreadcrumbResponse;
import com.EEIT25.unicloth.dto.category.CategoryDetailResponse;
import com.EEIT25.unicloth.dto.category.CategoryResponse;
import com.EEIT25.unicloth.dto.category.FilterOptionsResponse;
import com.EEIT25.unicloth.dto.category.ProductCardResponse;
import com.EEIT25.unicloth.dto.category.ProductFilterRequest;
import com.EEIT25.unicloth.entity.Category;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CategoryRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 分類篩選相關服務<br>
 * 分類照官網，3 或 4 層：性別（男裝）› 大類（T恤/背心/休閒）›（T恤/背心）› 細類（長袖），商品只掛在最底層。<br>
 * - {@link #getMenu()}：導覽選單，第 1 層 + 各自的第 2 層<br><br>
 * - {@link #getSubcategories(String)}：分類頁上方的下一層篩選按鈕<br><br>
 * - {@link #getBreadcrumb(String)}：分類頁上方的麵包屑<br><br>
 * - {@link #getProducts(String, ProductFilterRequest, Pageable)}：任一層分類底下的所有商品，可篩選顏色 / 尺寸 / 價格，分頁<br><br>
 * - {@link #getFilterOptions(String)}：分類頁的篩選選項（顏色、尺寸）
 */
@Service
@RequiredArgsConstructor
public class CategoryService {
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
    public CategoryDetailResponse getSubcategories(String code) {
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
     * 傳哪一層的 code 都可以，會包含它底下所有子孫分類的商品（第 2 層 → 底下第 3、4 層全部）。<br>
     * filter 裡沒填的條件就不篩（全部沒填 = 不篩）。
     */
    @Transactional
    public Page<ProductCardResponse> getProducts(String code, ProductFilterRequest filter, Pageable pageable) {
        List<Long> categoryIds = findLeafCategoryIds(code);

        boolean allColors = filter.colors() == null || filter.colors().isEmpty();   // 沒選顏色 = 全部顏色都可以
        boolean allSizes = filter.sizes() == null || filter.sizes().isEmpty();      // 沒選size = 全部size都可以
        // IN 的清單不能是空的，沒選時放一個佔位值；all* = true 時查詢不會用到它
        List<String> colors = allColors ? List.of("") : filter.colors();
        List<String> sizes = allSizes ? List.of("") : filter.sizes();

        Page<Product> products = productRepository.findByFilter(
                categoryIds, ProductStatus.ON_SALE,
                filter.minPrice(), filter.maxPrice(),
                !(allColors && allSizes),
                allColors, colors,
                allSizes, sizes,
                pageable);
        return products.map(ProductCardResponse::from);
    }

    /**
     * 分類頁的篩選選項：這個分類底下上架中的商品，實際有哪些顏色、尺寸。<br>
     * 範圍跟 {@link #getProducts(String, ProductFilterRequest, Pageable)} 一樣（自己 + 底下所有子孫分類）。
     */
    @Transactional
    public FilterOptionsResponse getFilterOptions(String code) {
        List<Long> categoryIds = findLeafCategoryIds(code);

        return new FilterOptionsResponse(
                variantRepository.findDistinctColors(categoryIds, ProductStatus.ON_SALE),
                variantRepository.findDistinctSizes(categoryIds, ProductStatus.ON_SALE));
    }

    /**
     * code → 自己 + 底下所有子孫分類的 id（不管幾層）。<br>
     * 商品掛在最底層，但有的分支 3 層、有的 4 層，所以整棵子樹都收，商品掛在哪一層都查得到。<br>
     * 分類只有幾百筆，一次全撈進記憶體再往下找，比一層查一次資料庫快。
     */
    private List<Long> findLeafCategoryIds(String code) {
        Category category = categoryRepository.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("找不到分類：" + code));

        // parent id → 它的子分類們，之後往下找就不用再查資料庫
        Map<Long, List<Category>> childrenByParentId = categoryRepository.findAll().stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId()));

        // 從自己開始，拿出一個 → 記下 id → 把它的子分類放回待處理清單，直到清單空了
        List<Long> ids = new ArrayList<>();
        Deque<Category> pending = new ArrayDeque<>(List.of(category));
        while (!pending.isEmpty()) {
            Category c = pending.pop();
            ids.add(c.getId());
            pending.addAll(childrenByParentId.getOrDefault(c.getId(), List.of()));
        }
        return ids;
    }
}
