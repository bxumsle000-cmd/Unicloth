package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.product.AdminCategoryTreeResponse;
import com.EEIT25.unicloth.dto.admin.product.CreateAdminCategoryRequest;
import com.EEIT25.unicloth.entity.Category;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CategoryRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCategoryService {

    private final CategoryRepository
            categoryRepository;

    private final ProductRepository
            productRepository;

    /**
     * 取得完整分類樹。
     */
    @Transactional(readOnly = true)
    public List<AdminCategoryTreeResponse>
    getCategoryTree() {
        List<Category> categories =
                categoryRepository.findAll();

        /*
         * 計算直接掛在各分類下的商品數量。
         */
        Map<Long, Long> directProductCounts =
                productRepository.findAll()
                        .stream()
                        .collect(
                                Collectors.groupingBy(
                                        product ->
                                                product
                                                        .getCategory()
                                                        .getId(),
                                        Collectors.counting()
                                )
                        );

        /*
         * 將所有非第一層分類，
         * 按照 parentId 分組。
         */
        Map<Long, List<Category>>
                childrenByParentId =
                categories.stream()
                        .filter(category ->
                                category.getParent()
                                        != null
                        )
                        .collect(
                                Collectors.groupingBy(
                                        category ->
                                                category
                                                        .getParent()
                                                        .getId()
                                )
                        );

        /*
         * 找出 parent 為 null 的第一層分類，
         * 再遞迴建立完整樹狀資料。
         */
        return categories.stream()
                .filter(category ->
                        category.getParent() == null
                )
                .sorted(
                        Comparator.comparing(
                                Category::getId
                        )
                )
                .map(category ->
                        buildTreeNode(
                                category,
                                childrenByParentId,
                                directProductCounts
                        )
                )
                .toList();
    }

    /**
     * 在指定分類下建立新的子分類。
     */
    @Transactional
    public AdminCategoryTreeResponse
    createCategory(
            CreateAdminCategoryRequest request
    ) {
        Category parent =
                categoryRepository
                        .findById(
                                request.parentId()
                        )
                        .orElseThrow(() ->
                                ApiException.notFound(
                                        "找不到上層分類：" +
                                                request.parentId()
                                )
                        );

        String name =
                request.name().trim();

        String code =
                request.code()
                        .trim()
                        .toLowerCase();

        if (
                categoryRepository
                        .findByCode(code)
                        .isPresent()
        ) {
            throw ApiException.conflict(
                    "分類代碼已存在：" + code
            );
        }

        if (
                categoryRepository
                        .findByNameAndParent(
                                name,
                                parent
                        )
                        .isPresent()
        ) {
            throw ApiException.conflict(
                    "「" +
                            parent.getName() +
                            "」底下已經有「" +
                            name +
                            "」分類"
            );
        }

        Category category =
                Category.builder()
                        .parent(parent)
                        .name(name)
                        .code(code)
                        .iconUrl(null)
                        .build();

        Category savedCategory =
                categoryRepository.save(
                        category
                );

        return new AdminCategoryTreeResponse(
                savedCategory.getId(),
                savedCategory.getName(),
                savedCategory.getCode(),
                savedCategory.getIconUrl(),
                0L,
                0L,
                List.of()
        );
    }

    /**
     * 遞迴建立一個分類節點，
     * 並加總所有子分類的商品數量。
     */
    private AdminCategoryTreeResponse buildTreeNode(
            Category category,

            Map<Long, List<Category>>
                    childrenByParentId,

            Map<Long, Long>
                    directProductCounts
    ) {
        List<AdminCategoryTreeResponse>
                childResponses =
                childrenByParentId
                        .getOrDefault(
                                category.getId(),
                                List.of()
                        )
                        .stream()
                        .sorted(
                                Comparator.comparing(
                                        Category::getId
                                )
                        )
                        .map(child ->
                                buildTreeNode(
                                        child,
                                        childrenByParentId,
                                        directProductCounts
                                )
                        )
                        .toList();

        long directProductCount =
                directProductCounts
                        .getOrDefault(
                                category.getId(),
                                0L
                        );

        long childrenProductCount =
                childResponses.stream()
                        .mapToLong(
                                AdminCategoryTreeResponse
                                        ::totalProductCount
                        )
                        .sum();

        return new AdminCategoryTreeResponse(
                category.getId(),
                category.getName(),
                category.getCode(),
                category.getIconUrl(),
                directProductCount,
                directProductCount +
                        childrenProductCount,
                childResponses
        );
    }
}