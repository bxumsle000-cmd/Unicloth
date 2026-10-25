package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.product.ProductScheduledOffAtResponse;
import com.EEIT25.unicloth.dto.admin.product.UpdateProductScheduledOffAtRequest;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminProductScheduleService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public ProductScheduledOffAtResponse getScheduledOffAt(
            Long productId
    ) {
        Product product = findProduct(productId);

        return new ProductScheduledOffAtResponse(
                product.getId(),
                product.getScheduledOffAt()
        );
    }

    @Transactional
    public ProductScheduledOffAtResponse updateScheduledOffAt(
            Long productId,
            UpdateProductScheduledOffAtRequest request
    ) {
        Product product = findProduct(productId);

        if (
                request.scheduledOffAt() != null &&
                        product.getStatus() != ProductStatus.ON_SALE
        ) {
            throw ApiException.badRequest(
                    "商品必須先上架，才能設定預定下架時間"
            );
        }

        product.setScheduledOffAt(
                request.scheduledOffAt()
        );

        return new ProductScheduledOffAtResponse(
                product.getId(),
                product.getScheduledOffAt()
        );
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() ->
                        ApiException.notFound(
                                "找不到商品：" + productId
                        )
                );
    }
}