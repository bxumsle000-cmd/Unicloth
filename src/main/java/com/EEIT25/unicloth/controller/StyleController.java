package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.style.StyleResponse;
import com.EEIT25.unicloth.service.StyleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 提供商品風格查詢 API。
 */
@RestController
@RequestMapping("/api/styles")
@RequiredArgsConstructor
public class StyleController {
    private final StyleService styleService;

    // 取得所有風格標籤
    @GetMapping
    public List<StyleResponse> getAllStyles() {
        return styleService.getAllStyles();
    }
}