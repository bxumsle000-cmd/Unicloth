package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.category.BreadcrumbResponse;
import com.EEIT25.unicloth.dto.category.CategoryDetailResponse;
import com.EEIT25.unicloth.dto.category.CategoryResponse;
import com.EEIT25.unicloth.dto.category.ProductCardResponse;
import com.EEIT25.unicloth.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;

    /** 導覽選單：第 1 層 + 各自的第 2 層 */
    @GetMapping
    public List<CategoryResponse> getMenu() {
        return categoryService.getMenu();
    }

    /** 分類頁上方的下一層篩選按鈕 */
    @GetMapping("/{code}")
    public CategoryDetailResponse getCategory(@PathVariable String code) {
        return categoryService.getCategory(code);
    }

    /** 分類頁上方的麵包屑 */
    @GetMapping("/{code}/breadcrumb")
    public List<BreadcrumbResponse> getBreadcrumb(@PathVariable String code) {
        return categoryService.getBreadcrumb(code);
    }

    /** 分類底下的商品，分頁：?page=0&size=20 */
    @GetMapping("/{code}/products")
    public Page<ProductCardResponse> getProducts(@PathVariable String code,
        @ParameterObject
        @PageableDefault(size = 25, sort = "id", direction = Sort.Direction.DESC)Pageable pageable) {
        return categoryService.getProducts(code, pageable);
    }
}
