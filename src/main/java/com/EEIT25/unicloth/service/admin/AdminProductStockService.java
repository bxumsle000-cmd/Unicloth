package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.product.UpdateProductStockRequest;
import com.EEIT25.unicloth.entity.InventoryTransaction;
import com.EEIT25.unicloth.entity.InventoryTransactionItem;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.entity.Staff;
import com.EEIT25.unicloth.enums.InventoryTransactionType;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.InventoryTransactionItemRepository;
import com.EEIT25.unicloth.repository.InventoryTransactionRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentStaff;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminProductStockService {

    private final ProductVariantRepository
            productVariantRepository;

    private final InventoryTransactionRepository
            inventoryTransactionRepository;

    private final InventoryTransactionItemRepository
            inventoryTransactionItemRepository;

    private final CurrentStaff currentStaff;

    /**
     * 後台手動修改一件商品的 SKU 庫存。
     *
     * 所有庫存會在同一個資料庫交易內完成，
     * 並建立一筆 ADJUSTMENT 庫存異動紀錄。
     */
    @Transactional
    public void updateStock(
            Long productId,
            UpdateProductStockRequest request
    ) {
        Set<Long> receivedVariantIds =
                new HashSet<>();

        for (
                UpdateProductStockRequest.VariantStockRequest
                        item : request.variants()
        ) {
            if (
                    !receivedVariantIds.add(
                            item.variantId()
                    )
            ) {
                throw ApiException.badRequest(
                        "商品規格重複：" +
                                item.variantId()
                );
            }
        }

        /*
         * 鎖定這次要修改的 SKU，
         * 避免進貨與手動修改同時發生時互相覆蓋。
         */
        List<ProductVariant> variants =
                productVariantRepository
                        .findAllByIdInForUpdate(
                                receivedVariantIds
                        );

        if (
                variants.size() !=
                        receivedVariantIds.size()
        ) {
            Set<Long> foundIds = variants.stream()
                    .map(ProductVariant::getId)
                    .collect(Collectors.toSet());

            String missingIds = receivedVariantIds
                    .stream()
                    .filter(id ->
                            !foundIds.contains(id)
                    )
                    .map(String::valueOf)
                    .collect(Collectors.joining("、"));

            throw ApiException.notFound(
                    "找不到商品規格：" + missingIds
            );
        }

        /*
         * 防止把其他商品的 SKU ID
         * 塞進這件商品的修改請求。
         */
        for (ProductVariant variant : variants) {
            if (
                    !variant.getProduct()
                            .getId()
                            .equals(productId)
            ) {
                throw ApiException.badRequest(
                        "商品規格不屬於這件商品：" +
                                variant.getId()
                );
            }
        }

        Map<Long, ProductVariant> variantsById =
                variants.stream()
                        .collect(Collectors.toMap(
                                ProductVariant::getId,
                                Function.identity()
                        ));

        List<InventoryTransactionItem>
                transactionItems =
                new ArrayList<>();

        /*
         * 先找出真正有變動的 SKU。
         * 如果輸入值與原庫存相同，就不建立異動明細。
         */
        for (
                UpdateProductStockRequest.VariantStockRequest
                        requestItem : request.variants()
        ) {
            ProductVariant variant =
                    variantsById.get(
                            requestItem.variantId()
                    );

            int stockBefore = variant.getStock();
            int stockAfter = requestItem.stock();

            if (stockBefore == stockAfter) {
                continue;
            }

            int quantityChange =
                    stockAfter - stockBefore;

            variant.setStock(stockAfter);

            InventoryTransactionItem item =
                    InventoryTransactionItem.builder()
                            .variant(variant)
                            .skuCode(
                                    variant.getSkuCode()
                            )
                            .productName(
                                    variant
                                            .getProduct()
                                            .getName()
                            )
                            .color(
                                    variant.getColor()
                            )
                            .size(
                                    variant.getSize()
                            )
                            .quantityChange(
                                    quantityChange
                            )
                            .stockBefore(
                                    stockBefore
                            )
                            .stockAfter(
                                    stockAfter
                            )
                            .build();

            transactionItems.add(item);
        }

        /*
         * 所有庫存都沒有改變時，
         * 不建立空白的異動紀錄。
         */
        if (transactionItems.isEmpty()) {
            return;
        }

        Staff staff = currentStaff.require();

        InventoryTransaction transaction =
                InventoryTransaction.builder()
                        .type(
                                InventoryTransactionType
                                        .ADJUSTMENT
                        )
                        .note(
                                "商品後台手動調整庫存"
                        )
                        .staff(staff)
                        .build();

        InventoryTransaction savedTransaction =
                inventoryTransactionRepository.save(
                        transaction
                );

        for (
                InventoryTransactionItem item :
                transactionItems
        ) {
            item.setTransaction(savedTransaction);
        }

        inventoryTransactionItemRepository.saveAll(
                transactionItems
        );
    }
}