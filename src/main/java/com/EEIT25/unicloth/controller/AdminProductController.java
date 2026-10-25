package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.admin.product.AdminProductDetailResponse;
import com.EEIT25.unicloth.dto.admin.product.AdminProductImageResponse;
import com.EEIT25.unicloth.dto.admin.product.AdminProductListResponse;
import com.EEIT25.unicloth.dto.admin.product.BatchUpdateProductCategoryRequest;
import com.EEIT25.unicloth.dto.admin.product.BatchUpdateProductStatusRequest;
import com.EEIT25.unicloth.dto.admin.product.CreateProductRequest;
import com.EEIT25.unicloth.dto.admin.product.CreateProductVariantsRequest;
import com.EEIT25.unicloth.dto.admin.product.UpdateProductRequest;
import com.EEIT25.unicloth.dto.admin.product.UpdateProductStatusRequest;
import com.EEIT25.unicloth.dto.admin.product.UpdateProductStockRequest;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.service.admin.AdminProductBatchService;
import com.EEIT25.unicloth.service.admin.AdminProductImageService;
import com.EEIT25.unicloth.service.admin.AdminProductService;
import com.EEIT25.unicloth.service.admin.AdminProductStockService;
import com.EEIT25.unicloth.service.admin.AdminProductVariantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/product/products")
public class AdminProductController {

    private final AdminProductService adminProductService;
    private final AdminProductImageService adminProductImageService;
    private final AdminProductVariantService adminProductVariantService;
    private final AdminProductBatchService adminProductBatchService;
    private final AdminProductStockService adminProductStockService;

    @GetMapping
    public Page<AdminProductListResponse> getProducts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) ProductStatus status,
            @ParameterObject
            @PageableDefault(
                    size = 20,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return adminProductService.getProducts(
                keyword,
                status,
                pageable
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminProductDetailResponse createProduct(
            @Valid @RequestBody CreateProductRequest request
    ) {
        return adminProductService.createProduct(request);
    }

    @PatchMapping("/batch-status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateBatchStatus(
            @Valid @RequestBody
            BatchUpdateProductStatusRequest request
    ) {
        adminProductBatchService.updateStatuses(request);
    }

    @PatchMapping("/batch-category")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateBatchCategory(
            @Valid @RequestBody
            BatchUpdateProductCategoryRequest request
    ) {
        adminProductBatchService.updateCategories(request);
    }

    @GetMapping("/{productId}")
    public AdminProductDetailResponse getProduct(
            @PathVariable Long productId
    ) {
        return adminProductService.getProduct(productId);
    }

    @PutMapping("/{productId}")
    public AdminProductDetailResponse updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        return adminProductService.updateProduct(
                productId,
                request
        );
    }

    @PostMapping(
            value = "/{productId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @ResponseStatus(HttpStatus.CREATED)
    public AdminProductImageResponse uploadImage(
            @PathVariable Long productId,
            @RequestParam("colorCode") String colorCode,
            @RequestPart("image") MultipartFile image
    ) {
        String imageUrl = adminProductImageService
                .saveProductImage(
                        productId,
                        colorCode,
                        image
                );

        return new AdminProductImageResponse(imageUrl);
    }

    @PostMapping("/{productId}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminProductDetailResponse createVariants(
            @PathVariable Long productId,
            @Valid @RequestBody
            CreateProductVariantsRequest request
    ) {
        return adminProductService.createVariants(
                productId,
                request
        );
    }

    @DeleteMapping("/{productId}/variants/{variantId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVariant(
            @PathVariable Long productId,
            @PathVariable Long variantId
    ) {
        adminProductVariantService.deleteVariant(
                productId,
                variantId
        );
    }

    @PatchMapping("/{productId}/stock")
    public AdminProductDetailResponse updateStock(
            @PathVariable Long productId,
            @Valid @RequestBody
            UpdateProductStockRequest request
    ) {
        adminProductStockService.updateStock(
                productId,
                request
        );

        return adminProductService.getProduct(productId);
    }

    @PatchMapping("/{productId}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateStatus(
            @PathVariable Long productId,
            @Valid @RequestBody
            UpdateProductStatusRequest request
    ) {
        adminProductService.updateStatus(
                productId,
                request
        );
    }
}