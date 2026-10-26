package com.EEIT25.unicloth.controller.admin;

import com.EEIT25.unicloth.dto.admin.product.ProductScheduledOffAtResponse;
import com.EEIT25.unicloth.dto.admin.product.UpdateProductScheduledOffAtRequest;
import com.EEIT25.unicloth.service.admin.AdminProductScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/product/product-schedules")
public class AdminProductScheduleController {

    private final AdminProductScheduleService adminProductScheduleService;

    @GetMapping("/{productId}")
    public ProductScheduledOffAtResponse getScheduledOffAt(
            @PathVariable Long productId
    ) {
        return adminProductScheduleService.getScheduledOffAt(
                productId
        );
    }

    @PatchMapping("/{productId}")
    public ProductScheduledOffAtResponse updateScheduledOffAt(
            @PathVariable Long productId,
            @Valid @RequestBody
            UpdateProductScheduledOffAtRequest request
    ) {
        return adminProductScheduleService.updateScheduledOffAt(
                productId,
                request
        );
    }
}