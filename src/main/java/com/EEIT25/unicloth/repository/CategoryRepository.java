package com.EEIT25.unicloth.repository;

import com.EEIT25.unicloth.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // 找主分類（parent 是 null 的那些）
    Optional<Category> findByNameAndParentIsNull(String name);

    // 找某個主分類底下的副分類
    Optional<Category> findByNameAndParent(String name, Category parent);

    // 用固定代碼找分類（男裝、女裝都有「大衣」，用名稱會找錯，用 code 不會）
    Optional<Category> findByCode(String code);

    /** 所有第一層分類（男裝 / 女裝 / 童裝）*/
    List<Category> findByParentIsNullOrderByIdAsc();

    /** 某個分類底下的子分類（只往下一層） */
    List<Category> findByParentOrderByIdAsc(Category parent);
}
