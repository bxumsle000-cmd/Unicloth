package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AdminProductVariantService {

    private final ProductRepository productRepository;

    private final ProductVariantRepository
            productVariantRepository;

    /**
     * 刪除一筆商品 SKU。
     *
     * 商品必須先下架，而且該 SKU 的庫存必須為 0。
     */
    @Transactional
    public void deleteVariant(
            Long productId,
            Long variantId
    ) {
        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        ApiException.notFound(
                                "找不到商品：" + productId
                        )
                );

        if (
                product.getStatus() !=
                        ProductStatus.OFF_SHELF
        ) {
            throw ApiException.badRequest(
                    "請先將商品下架，再刪除 SKU"
            );
        }

        List<ProductVariant> variants =
                productVariantRepository
                        .findByProductIdOrderByIdAsc(
                                productId
                        );

        ProductVariant targetVariant =
                variants.stream()
                        .filter(variant ->
                                Objects.equals(
                                        variant.getId(),
                                        variantId
                                )
                        )
                        .findFirst()
                        .orElseThrow(() ->
                                ApiException.notFound(
                                        "找不到這件商品的 SKU：" +
                                                variantId
                                )
                        );

        if (targetVariant.getStock() > 0) {
            throw ApiException.badRequest(
                    "此 SKU 尚有 " +
                            targetVariant.getStock() +
                            " 件庫存，請先將庫存調整為 0"
            );
        }

        List<ProductVariant> remainingVariants =
                variants.stream()
                        .filter(variant ->
                                !Objects.equals(
                                        variant.getId(),
                                        variantId
                                )
                        )
                        .toList();

        productVariantRepository.delete(
                targetVariant
        );

        updateProductMainImage(
                product,
                targetVariant,
                remainingVariants
        );
    }

    /**
     * 如果刪掉的是商品主圖使用的最後一筆 SKU，
     * 就改用剩餘 SKU 的第一張圖片。
     */
    private void updateProductMainImage(
            Product product,
            ProductVariant deletedVariant,
            List<ProductVariant> remainingVariants
    ) {
        String currentMainImage =
                product.getImageUrl();

        String deletedImage =
                deletedVariant.getUrl();

        if (
                currentMainImage == null ||
                        !currentMainImage.equals(
                                deletedImage
                        )
        ) {
            return;
        }

        boolean imageStillUsed =
                remainingVariants.stream()
                        .anyMatch(variant ->
                                deletedImage.equals(
                                        variant.getUrl()
                                )
                        );

        if (imageStillUsed) {
            return;
        }

        String nextImage =
                remainingVariants.stream()
                        .map(ProductVariant::getUrl)
                        .filter(Objects::nonNull)
                        .filter(url -> !url.isBlank())
                        .findFirst()
                        .orElse(null);

        product.setImageUrl(nextImage);
    }
}