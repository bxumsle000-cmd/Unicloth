package com.EEIT25.unicloth.service.shop;

import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.Style;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.StyleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 處理商品與風格標籤的關聯。
 */
@Service
@RequiredArgsConstructor
public class ProductStyleService {
    private final StyleRepository styleRepository;

    /**
     * 將選擇的風格標籤設定到商品。
     */
    @Transactional
    public void applyStyles(Product product, Set<Long> styleIds) {
        // 沒有傳入欄位時保留商品原本的標籤
        if (styleIds == null) {
            return;
        }

        // 空陣列代表清除商品的全部標籤
        if (styleIds.isEmpty()) {
            product.getStyles().clear();
            return;
        }

        List<Style> styles = styleRepository.findAllById(styleIds);

        // 避免商品連結到不存在的標籤
        if (styles.size() != styleIds.size()) {
            throw ApiException.badRequest("包含不存在的風格標籤");
        }

        product.setStyles(new HashSet<>(styles));
    }
}