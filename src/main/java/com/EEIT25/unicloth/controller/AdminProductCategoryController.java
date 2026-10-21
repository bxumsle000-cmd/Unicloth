package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.admin.product.AdminCategoryOptionResponse;
import com.EEIT25.unicloth.dto.admin.product.AdminCategoryTreeResponse;
import com.EEIT25.unicloth.dto.admin.product.CreateAdminCategoryRequest;
import com.EEIT25.unicloth.service.AdminCategoryService;
import com.EEIT25.unicloth.service.AdminProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/product/categories")
public class AdminProductCategoryController {

    private final AdminProductService
            adminProductService;

    private final AdminCategoryService
            adminCategoryService;

    /**
     * 取得商品新增、編輯時，
     * 可以選擇的所有最底層分類。
     */
    @GetMapping
    public List<AdminCategoryOptionResponse>
    getCategoryOptions() {
        return adminProductService
                .getCategoryOptions();
    }

    /**
     * 取得分類管理使用的完整分類樹。
     */
    @GetMapping("/tree")
    public List<AdminCategoryTreeResponse>
    getCategoryTree() {
        return adminCategoryService
                .getCategoryTree();
    }

    /**
     * 在指定分類下建立新的子分類。
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminCategoryTreeResponse
    createCategory(
            @Valid
            @RequestBody
            CreateAdminCategoryRequest request
    ) {
        return adminCategoryService
                .createCategory(request);
    }
}