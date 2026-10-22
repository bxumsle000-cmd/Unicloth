package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Style;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 查詢與管理商品風格。
 */
public interface StyleRepository extends JpaRepository<Style, Long> {
    // 使用固定代碼查詢，例如 japanese
    Optional<Style> findByCode(String code);

    // 使用顯示名稱查詢，例如日系
    Optional<Style> findByName(String name);
}