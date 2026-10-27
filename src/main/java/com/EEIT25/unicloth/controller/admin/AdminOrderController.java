package com.EEIT25.unicloth.controller.admin;

import com.EEIT25.unicloth.dto.admin.order.AdminOrderDetailResponse;
import com.EEIT25.unicloth.dto.admin.order.AdminOrderFilterRequest;
import com.EEIT25.unicloth.dto.admin.order.AdminOrderListResponse;
import com.EEIT25.unicloth.dto.admin.order.ShipOrderRequest;
import com.EEIT25.unicloth.enums.order.OrderStatus;
import com.EEIT25.unicloth.enums.order.ShippingMethod;
import com.EEIT25.unicloth.service.admin.AdminOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 訂單物流部門的後台 API。
 *
 * 這裡只負責接收前端請求、整理參數、回傳資料；
 * 資料庫查詢與商業規則則交給 AdminOrderService。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/order/orders")
public class AdminOrderController {
    private final AdminOrderService adminOrderService;

    /**
     * 取得可搜尋、篩選、分頁的訂單清單。
     *
     * page 從 0 開始；未傳入排序時，以最新建立的訂單排在最前面。
     */
    @GetMapping
    public Page<AdminOrderListResponse> getOrders(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) ShippingMethod shippingMethod,
            @ParameterObject
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        AdminOrderFilterRequest filter = new AdminOrderFilterRequest(
                keyword,
                status,
                shippingMethod
        );
        return adminOrderService.getOrders(filter, pageable);
    }

    /**
     * 取得單筆訂單的完整物流、收件與商品快照資料。
     *
     * orderId 是 orders 資料表的主鍵，不是顯示給使用者看的 orderNo。
     */
    @GetMapping("/{orderId}")
    public AdminOrderDetailResponse getOrder(@PathVariable Long orderId) {
        return adminOrderService.getOrder(orderId);
    }

    /**
     * 確認訂單出貨。
     *
     * PATCH 代表只更新訂單的一部分資料；
     * @Valid 會先檢查物流商與追蹤碼不可空白，再交給 Service。
     */
    @PatchMapping("/{orderId}/ship")
    public AdminOrderDetailResponse shipOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody ShipOrderRequest request
    ) {
        return adminOrderService.shipOrder(orderId, request);
    }

    /**
     * 在尚未出貨前取消訂單。
     *
     * 取消會回補庫存、釋放優惠券，但不會呼叫外部金流退款。
     */
    @PatchMapping("/{orderId}/cancel")
    public AdminOrderDetailResponse cancelOrder(@PathVariable Long orderId) {
        return adminOrderService.cancelOrder(orderId);
    }

    /**
     * 確認物流已送達。
     *
     * 不接收前端送來的時間，統一由後端記錄，避免使用者偽造送達時間。
     */
    @PatchMapping("/{orderId}/deliver")
    public AdminOrderDetailResponse markDelivered(@PathVariable Long orderId) {
        return adminOrderService.markDelivered(orderId);
    }

    /**
     * 手動確認會員已取貨。
     *
     * 目前尚未串接物流商，因此由物流人員在後台手動操作。
     */
    @PatchMapping("/{orderId}/pickup")
    public AdminOrderDetailResponse markPickedUp(@PathVariable Long orderId) {
        return adminOrderService.markPickedUp(orderId);
    }
}