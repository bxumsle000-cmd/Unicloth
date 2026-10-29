package com.EEIT25.unicloth.service.shop;

import com.EEIT25.unicloth.dto.store.style.StyleResponse;
import com.EEIT25.unicloth.repository.StyleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 處理商品風格相關功能。
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StyleService {
    private final StyleRepository styleRepository;

    // 取得所有可使用的風格標籤
    public List<StyleResponse> getAllStyles() {
        return styleRepository.findAll()
                .stream()
                .map(StyleResponse::from)
                .toList();
    }
}