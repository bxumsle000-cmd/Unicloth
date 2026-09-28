package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.category.ProductCardResponse;
import com.EEIT25.unicloth.dto.product.ProductDetailResponse;
import com.EEIT25.unicloth.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService ;

    /** 搜尋商品名稱，分頁：/api/products?keyword=外套&page=0&size=20 */
    @GetMapping
    public Page<ProductCardResponse> searchProducts(@RequestParam(defaultValue = "") String keyword,
        @ParameterObject
        @PageableDefault(size = 25, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return productService.getProductsBySearch(keyword, pageable);
    }

    @GetMapping("{slug}")
    public ProductDetailResponse getProductDetail(@PathVariable String slug){
        return  productService.getProductDetail(slug);
    }

}
