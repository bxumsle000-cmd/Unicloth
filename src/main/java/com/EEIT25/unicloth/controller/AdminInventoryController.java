package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.admin.product.AdminLowStockResponse;
import com.EEIT25.unicloth.dto.admin.product.InventoryTransactionResponse;
import com.EEIT25.unicloth.dto.admin.product.ReceiveProductStockRequest;
import com.EEIT25.unicloth.service.admin.AdminInventoryService;
import com.EEIT25.unicloth.service.admin.AdminLowStockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/product/inventory")
public class AdminInventoryController {

    private final AdminInventoryService
            adminInventoryService;

    private final AdminLowStockService
            adminLowStockService;

    /**
     * 進貨入庫。
     */
    @PostMapping("/receive")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryTransactionResponse receiveStock(
            @Valid
            @RequestBody
            ReceiveProductStockRequest request
    ) {
        return adminInventoryService.receiveStock(
                request
        );
    }

    /**
     * 分頁取得庫存異動紀錄。
     */
    @GetMapping("/transactions")
    public Page<InventoryTransactionResponse>
    getTransactions(
            @ParameterObject
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return adminInventoryService.getTransactions(
                pageable
        );
    }

    /**
     * 取得上架中商品的庫存警示。
     *
     * 範例：
     * GET /api/admin/product/inventory/warnings
     * GET /api/admin/product/inventory/warnings?threshold=10
     */
    @GetMapping("/warnings")
    public List<AdminLowStockResponse>
    getStockWarnings(
            @RequestParam(defaultValue = "5")
            Integer threshold
    ) {
        return adminLowStockService.getWarnings(
                threshold
        );
    }
}