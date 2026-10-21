package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.admin.product.AdminCategoryOptionResponse;
import com.EEIT25.unicloth.dto.admin.product.AdminProductDetailResponse;
import com.EEIT25.unicloth.dto.admin.product.AdminProductListResponse;
import com.EEIT25.unicloth.dto.admin.product.CreateProductRequest;
import com.EEIT25.unicloth.dto.admin.product.CreateProductVariantsRequest;
import com.EEIT25.unicloth.dto.admin.product.UpdateProductRequest;
import com.EEIT25.unicloth.dto.admin.product.UpdateProductStatusRequest;
import com.EEIT25.unicloth.dto.admin.product.UpdateProductStockRequest;
import com.EEIT25.unicloth.entity.Category;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CategoryRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;

    /**
     * 後台商品列表。
     */
    @Transactional(readOnly = true)
    public Page<AdminProductListResponse> getProducts(
            String keyword,
            ProductStatus status,
            Pageable pageable
    ) {
        String normalizedKeyword =
                keyword == null ? "" : keyword.trim();

        Page<Product> products =
                productRepository.findAdminProducts(
                        normalizedKeyword,
                        status,
                        pageable
                );

        List<Long> productIds = products.getContent()
                .stream()
                .map(Product::getId)
                .toList();

        Map<Long, Integer> stockByProductId;

        if (productIds.isEmpty()) {
            stockByProductId = Map.of();
        } else {
            stockByProductId = productVariantRepository
                    .findByProductIdInOrderByIdAsc(productIds)
                    .stream()
                    .collect(Collectors.groupingBy(
                            variant ->
                                    variant.getProduct().getId(),
                            Collectors.summingInt(
                                    ProductVariant::getStock
                            )
                    ));
        }

        return products.map(product ->
                new AdminProductListResponse(
                        product.getId(),
                        product.getSlug(),
                        product.getName(),
                        product.getCategory().getName(),
                        product.getCategory().getCode(),
                        product.getPrice(),
                        stockByProductId.getOrDefault(
                                product.getId(),
                                0
                        ),
                        product.getStatus(),
                        product.getImageUrl()
                )
        );
    }

    /**
     * 取得後台商品可選擇的最底層分類。
     */
    @Transactional(readOnly = true)
    public List<AdminCategoryOptionResponse>
    getCategoryOptions() {
        List<Category> categories =
                categoryRepository.findAll();

        Set<Long> parentIds = categories.stream()
                .map(Category::getParent)
                .filter(parent -> parent != null)
                .map(Category::getId)
                .collect(Collectors.toSet());

        return categories.stream()
                .filter(category ->
                        !parentIds.contains(category.getId())
                )
                .map(category ->
                        new AdminCategoryOptionResponse(
                                category.getId(),
                                category.getCode(),
                                category.getName(),
                                buildCategoryPath(category)
                        )
                )
                .sorted(Comparator.comparing(
                        AdminCategoryOptionResponse::path
                ))
                .toList();
    }

    /**
     * 建立新商品。
     *
     * 新商品沒有 SKU 與庫存，
     * 因此預設為已下架。
     */
    @Transactional
    public AdminProductDetailResponse createProduct(
            CreateProductRequest request
    ) {
        Category category =
                findLeafCategory(request.categoryId());

        validatePrices(
                request.price(),
                request.origPrice()
        );

        String productNumber =
                request.productNumber().trim();

        String productNumberSuffix =
                "-" + productNumber;

        if (
                productRepository.existsBySlugEndingWith(
                        productNumberSuffix
                )
        ) {
            throw ApiException.conflict(
                    "商品貨號已存在：" +
                            productNumber
            );
        }

        String slug =
                resolveSlugPrefix(category) +
                        productNumberSuffix;

        Product product = Product.builder()
                .slug(slug)
                .category(category)
                .name(request.name().trim())
                .description(
                        normalizeDescription(
                                request.description()
                        )
                )
                .price(request.price())
                .origPrice(request.origPrice())
                .newArrival(request.newArrival())
                .hot(request.hot())
                .imageUrl(null)
                .status(ProductStatus.OFF_SHELF)
                .build();

        Product savedProduct =
                productRepository.save(product);

        return toDetailResponse(
                savedProduct,
                List.of()
        );
    }

    /**
     * 為商品建立一個顏色的多個尺寸 SKU。
     */
    @Transactional
    public AdminProductDetailResponse createVariants(
            Long productId,
            CreateProductVariantsRequest request
    ) {
        Product product = findProduct(productId);

        List<ProductVariant> existingVariants =
                productVariantRepository
                        .findByProductIdOrderByIdAsc(productId);

        String color = request.color().trim();

        String colorCode = request.colorCode()
                .trim()
                .toUpperCase(Locale.ROOT);

        String imageUrl = request.imageUrl().trim();

        String productNumber =
                extractProductNumber(product.getSlug());

        Set<String> existingCombinations =
                existingVariants.stream()
                        .map(variant ->
                                variantKey(
                                        variant.getColor(),
                                        variant.getSize()
                                )
                        )
                        .collect(Collectors.toSet());

        Set<String> existingSkuCodes =
                existingVariants.stream()
                        .map(variant ->
                                variant.getSkuCode()
                                        .toUpperCase(Locale.ROOT)
                        )
                        .collect(Collectors.toSet());

        Set<String> receivedSizes = new HashSet<>();
        List<ProductVariant> newVariants =
                new ArrayList<>();

        for (
                CreateProductVariantsRequest.VariantRequest
                        item : request.variants()
        ) {
            String size = normalizeSize(item.size());

            if (!receivedSizes.add(size)) {
                throw ApiException.badRequest(
                        "尺寸重複：" + size
                );
            }

            String combinationKey =
                    variantKey(color, size);

            if (
                    existingCombinations.contains(
                            combinationKey
                    )
            ) {
                throw ApiException.conflict(
                        color + "／" + size +
                                " 已經存在"
                );
            }

            String skuCode =
                    productNumber +
                            "-" +
                            colorCode +
                            "-" +
                            size.replace(" ", "-");

            if (
                    existingSkuCodes.contains(
                            skuCode.toUpperCase(Locale.ROOT)
                    )
            ) {
                throw ApiException.conflict(
                        "SKU 已經存在：" + skuCode
                );
            }

            ProductVariant variant =
                    ProductVariant.builder()
                            .product(product)
                            .color(color)
                            .size(size)
                            .skuCode(skuCode)
                            .stock(item.stock())
                            .url(imageUrl)
                            .build();

            newVariants.add(variant);
            existingCombinations.add(combinationKey);
            existingSkuCodes.add(
                    skuCode.toUpperCase(Locale.ROOT)
            );
        }

        productVariantRepository.saveAll(newVariants);

        if (
                product.getImageUrl() == null ||
                        product.getImageUrl().isBlank()
        ) {
            product.setImageUrl(imageUrl);
        }

        List<ProductVariant> allVariants =
                productVariantRepository
                        .findByProductIdOrderByIdAsc(productId);

        return toDetailResponse(product, allVariants);
    }

    /**
     * 取得一件商品的完整後台資料。
     */
    @Transactional(readOnly = true)
    public AdminProductDetailResponse getProduct(
            Long productId
    ) {
        Product product = findProduct(productId);

        List<ProductVariant> variants =
                productVariantRepository
                        .findByProductIdOrderByIdAsc(productId);

        return toDetailResponse(product, variants);
    }

    /**
     * 更新商品基本資料。
     */
    @Transactional
    public AdminProductDetailResponse updateProduct(
            Long productId,
            UpdateProductRequest request
    ) {
        Product product = findProduct(productId);

        Category category =
                findLeafCategory(request.categoryId());

        validatePrices(
                request.price(),
                request.origPrice()
        );

        product.setName(request.name().trim());
        product.setDescription(
                normalizeDescription(
                        request.description()
                )
        );
        product.setPrice(request.price());
        product.setOrigPrice(request.origPrice());
        product.setCategory(category);
        product.setNewArrival(request.newArrival());
        product.setHot(request.hot());

        List<ProductVariant> variants =
                productVariantRepository
                        .findByProductIdOrderByIdAsc(productId);

        return toDetailResponse(product, variants);
    }

    /**
     * 更新商品各個 SKU 的庫存。
     */
    @Transactional
    public AdminProductDetailResponse updateStock(
            Long productId,
            UpdateProductStockRequest request
    ) {
        Product product = findProduct(productId);

        List<ProductVariant> variants =
                productVariantRepository
                        .findByProductIdOrderByIdAsc(productId);

        Map<Long, ProductVariant> variantsById =
                variants.stream()
                        .collect(Collectors.toMap(
                                ProductVariant::getId,
                                variant -> variant
                        ));

        Set<Long> receivedIds = new HashSet<>();

        for (
                UpdateProductStockRequest.VariantStockRequest
                        item : request.variants()
        ) {
            if (!receivedIds.add(item.variantId())) {
                throw ApiException.badRequest(
                        "商品規格重複：" +
                                item.variantId()
                );
            }

            ProductVariant variant =
                    variantsById.get(item.variantId());

            if (variant == null) {
                throw ApiException.badRequest(
                        "商品規格不屬於這件商品：" +
                                item.variantId()
                );
            }

            variant.setStock(item.stock());
        }

        return toDetailResponse(product, variants);
    }

    /**
     * 商品上架或下架。
     */
    @Transactional
    public void updateStatus(
            Long productId,
            UpdateProductStatusRequest request
    ) {
        Product product = findProduct(productId);

        ProductStatus newStatus = request.status();

        if (product.getStatus() == newStatus) {
            return;
        }

        if (newStatus == ProductStatus.ON_SALE) {
            int totalStock = productVariantRepository
                    .findByProductIdOrderByIdAsc(productId)
                    .stream()
                    .mapToInt(ProductVariant::getStock)
                    .sum();

            if (totalStock <= 0) {
                throw ApiException.badRequest(
                        "商品沒有庫存，不能上架"
                );
            }
        }

        product.setStatus(newStatus);
    }

    /**
     * 共用商品查詢。
     */
    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() ->
                        ApiException.notFound(
                                "找不到商品：" + productId
                        )
                );
    }

    /**
     * 查詢並驗證商品分類。
     */
    private Category findLeafCategory(Long categoryId) {
        Category category = categoryRepository
                .findById(categoryId)
                .orElseThrow(() ->
                        ApiException.notFound(
                                "找不到商品分類：" +
                                        categoryId
                        )
                );

        boolean hasChildren = !categoryRepository
                .findByParentOrderByIdAsc(category)
                .isEmpty();

        if (hasChildren) {
            throw ApiException.badRequest(
                    "請選擇最下層商品分類"
            );
        }

        return category;
    }

    /**
     * 驗證售價與原價。
     */
    private void validatePrices(
            Integer price,
            Integer origPrice
    ) {
        if (
                origPrice != null &&
                        origPrice <= price
        ) {
            throw ApiException.badRequest(
                    "原價必須大於售價"
            );
        }
    }

    /**
     * 空白商品說明存成 null。
     */
    private String normalizeDescription(
            String description
    ) {
        if (
                description == null ||
                        description.isBlank()
        ) {
            return null;
        }

        return description.trim();
    }

    /**
     * 尺寸去除頭尾空白並統一成大寫。
     */
    private String normalizeSize(String size) {
        return size.trim()
                .replaceAll("\\s+", " ")
                .toUpperCase(Locale.ROOT);
    }

    /**
     * 建立顏色與尺寸的比較鍵。
     */
    private String variantKey(
            String color,
            String size
    ) {
        return color.trim()
                .toLowerCase(Locale.ROOT) +
                "|" +
                normalizeSize(size);
    }

    /**
     * 從 women-123456 取出 123456。
     */
    private String extractProductNumber(String slug) {
        int separatorIndex = slug.lastIndexOf("-");

        if (
                separatorIndex < 0 ||
                        separatorIndex ==
                                slug.length() - 1
        ) {
            throw ApiException.badRequest(
                    "商品代碼格式錯誤：" + slug
            );
        }

        return slug.substring(separatorIndex + 1);
    }

    /**
     * 依分類最上層決定 slug 前綴。
     */
    private String resolveSlugPrefix(
            Category category
    ) {
        Category root = category;

        while (root.getParent() != null) {
            root = root.getParent();
        }

        String rootCode = root.getCode();

        if (rootCode.startsWith("all_women")) {
            return "women";
        }

        if (rootCode.startsWith("all_men")) {
            return "men";
        }

        if (rootCode.startsWith("all_kids")) {
            return "kids";
        }

        throw ApiException.badRequest(
                "無法判斷商品分類的網址前綴"
        );
    }

    /**
     * 建立分類完整路徑。
     */
    private String buildCategoryPath(
            Category category
    ) {
        List<String> names = new ArrayList<>();

        for (
                Category current = category;
                current != null;
                current = current.getParent()
        ) {
            names.add(0, current.getName());
        }

        return String.join("／", names);
    }

    /**
     * 將 Product 與 SKU 轉成後台詳細資料。
     */
    private AdminProductDetailResponse toDetailResponse(
            Product product,
            List<ProductVariant> variants
    ) {
        List<AdminProductDetailResponse.VariantResponse>
                variantResponses =
                variants.stream()
                        .map(variant ->
                                new AdminProductDetailResponse
                                        .VariantResponse(
                                        variant.getId(),
                                        variant.getColor(),
                                        variant.getSize(),
                                        variant.getSkuCode(),
                                        variant.getStock(),
                                        variant.getUrl()
                                )
                        )
                        .toList();

        return new AdminProductDetailResponse(
                product.getId(),
                product.getSlug(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getOrigPrice(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getCategory().getCode(),
                product.isNewArrival(),
                product.isHot(),
                product.getStatus(),
                product.getImageUrl(),
                variantResponses
        );
    }
}