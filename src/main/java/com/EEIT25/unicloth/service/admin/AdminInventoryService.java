package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.dto.admin.product.InventoryTransactionResponse;
import com.EEIT25.unicloth.dto.admin.product.ReceiveProductStockRequest;
import com.EEIT25.unicloth.entity.InventoryTransaction;
import com.EEIT25.unicloth.entity.InventoryTransactionItem;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.entity.Staff;
import com.EEIT25.unicloth.enums.product.InventoryTransactionType;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.InventoryTransactionItemRepository;
import com.EEIT25.unicloth.repository.InventoryTransactionRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentStaff;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class AdminInventoryService {

    private final ProductVariantRepository
            productVariantRepository;

    private final InventoryTransactionRepository
            inventoryTransactionRepository;

    private final InventoryTransactionItemRepository
            inventoryTransactionItemRepository;

    private final CurrentStaff currentStaff;

    /**
     * 進貨入庫。
     *
     * 所有 SKU 會在同一個資料庫交易內一起完成，
     * 中途任何一筆失敗，整批都不會寫入。
     */
    @Transactional
    public InventoryTransactionResponse receiveStock(
            ReceiveProductStockRequest request
    ) {
        Set<Long> receivedVariantIds =
                new HashSet<>();

        for (
                ReceiveProductStockRequest.ReceiveItem
                        item : request.items()
        ) {
            if (
                    !receivedVariantIds.add(
                            item.variantId()
                    )
            ) {
                throw ApiException.badRequest(
                        "進貨清單中有重複的 SKU：" +
                                item.variantId()
                );
            }
        }

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
                    "找不到 SKU：" + missingIds
            );
        }

        Map<Long, ProductVariant> variantsById =
                variants.stream()
                        .collect(Collectors.toMap(
                                ProductVariant::getId,
                                Function.identity()
                        ));

        Staff staff = currentStaff.require();

        InventoryTransaction transaction =
                InventoryTransaction.builder()
                        .type(
                                InventoryTransactionType
                                        .RECEIVE
                        )
                        .note(
                                normalizeNote(
                                        request.note()
                                )
                        )
                        .staff(staff)
                        .build();

        InventoryTransaction savedTransaction =
                inventoryTransactionRepository.save(
                        transaction
                );

        List<InventoryTransactionItem>
                transactionItems =
                new ArrayList<>();

        for (
                ReceiveProductStockRequest.ReceiveItem
                        requestItem : request.items()
        ) {
            ProductVariant variant =
                    variantsById.get(
                            requestItem.variantId()
                    );

            int stockBefore = variant.getStock();
            int quantity = requestItem.quantity();

            long calculatedStock =
                    (long) stockBefore + quantity;

            if (calculatedStock > Integer.MAX_VALUE) {
                throw ApiException.badRequest(
                        variant.getSkuCode() +
                                " 入庫後的庫存數量過大"
                );
            }

            int stockAfter =
                    (int) calculatedStock;

            variant.setStock(stockAfter);

            InventoryTransactionItem
                    transactionItem =
                    InventoryTransactionItem.builder()
                            .transaction(
                                    savedTransaction
                            )
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
                                    quantity
                            )
                            .stockBefore(
                                    stockBefore
                            )
                            .stockAfter(
                                    stockAfter
                            )
                            .build();

            transactionItems.add(
                    transactionItem
            );
        }

        List<InventoryTransactionItem> savedItems =
                inventoryTransactionItemRepository
                        .saveAll(transactionItems);

        return toResponse(
                savedTransaction,
                savedItems
        );
    }

    /**
     * 分頁取得庫存異動紀錄。
     */
    @Transactional(readOnly = true)
    public Page<InventoryTransactionResponse>
    getTransactions(Pageable pageable) {
        Page<InventoryTransaction> transactions =
                inventoryTransactionRepository
                        .findAll(pageable);

        List<Long> transactionIds =
                transactions.getContent()
                        .stream()
                        .map(
                                InventoryTransaction::getId
                        )
                        .toList();

        Map<Long, List<InventoryTransactionItem>>
                itemsByTransactionId;

        if (transactionIds.isEmpty()) {
            itemsByTransactionId = Map.of();
        } else {
            itemsByTransactionId =
                    inventoryTransactionItemRepository
                            .findByTransactionIdInOrderByIdAsc(
                                    transactionIds
                            )
                            .stream()
                            .collect(
                                    Collectors.groupingBy(
                                            item ->
                                                    item
                                                            .getTransaction()
                                                            .getId()
                                    )
                            );
        }

        return transactions.map(transaction ->
                toResponse(
                        transaction,
                        itemsByTransactionId
                                .getOrDefault(
                                        transaction.getId(),
                                        List.of()
                                )
                )
        );
    }

    /**
     * 空白備註存成 null。
     */
    private String normalizeNote(String note) {
        if (
                note == null ||
                        note.isBlank()
        ) {
            return null;
        }

        return note.trim();
    }

    /**
     * Entity 轉成前端回應。
     */
    private InventoryTransactionResponse toResponse(
            InventoryTransaction transaction,
            List<InventoryTransactionItem> items
    ) {
        List<
                InventoryTransactionResponse.ItemResponse
                > itemResponses =
                items.stream()
                        .map(item ->
                                new InventoryTransactionResponse
                                        .ItemResponse(
                                        item.getId(),
                                        item.getVariant() == null
                                                ? null
                                                : item
                                                .getVariant()
                                                .getId(),
                                        item.getSkuCode(),
                                        item.getProductName(),
                                        item.getColor(),
                                        item.getSize(),
                                        item.getQuantityChange(),
                                        item.getStockBefore(),
                                        item.getStockAfter()
                                )
                        )
                        .toList();

        return new InventoryTransactionResponse(
                transaction.getId(),
                transaction.getType(),
                transaction.getNote(),
                transaction.getStaff().getId(),
                transaction.getStaff().getName(),
                transaction.getCreatedAt(),
                itemResponses
        );
    }
}