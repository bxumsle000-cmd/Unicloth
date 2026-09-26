package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.product.ProductDetailResponse;
import com.EEIT25.unicloth.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService ;

    @GetMapping("{slug}")
    public ProductDetailResponse getProductDetail(@PathVariable String slug){
        return  productService.getProductDetail(slug);
    }

}
