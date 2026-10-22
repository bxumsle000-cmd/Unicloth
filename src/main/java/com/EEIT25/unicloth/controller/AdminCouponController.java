package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.admin.mkt.AdminCouponGrantResponse;
import com.EEIT25.unicloth.dto.admin.mkt.AdminCouponListResponse;
import com.EEIT25.unicloth.dto.admin.mkt.CreateCouponRequest;
import com.EEIT25.unicloth.dto.admin.mkt.GrantCouponToMemberRequest;
import com.EEIT25.unicloth.dto.admin.mkt.UpdateCouponActiveRequest;
import com.EEIT25.unicloth.service.AdminCouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 行銷部門的折價券後台 API。
 *
 * 此路徑受到 SecurityConfig 保護，
 * 只有 MKT 與 ADMIN 員工帳號可以使用。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/mkt/coupons")
public class AdminCouponController {
    private final AdminCouponService adminCouponService;

    /**
     * 取得可搜尋、篩選與分頁的折價券範本清單。
     *
     * active 不傳時查全部；
     * page 從 0 開始，預設最新建立的券排在前面。
     */
    @GetMapping
    public Page<AdminCouponListResponse> getCoupons(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) Boolean active,
            @ParameterObject
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return adminCouponService.getCoupons(
                keyword,
                active,
                pageable
        );
    }

    /**
     * 取得某張折價券實際發給會員的紀錄。
     *
     * 預設依發送時間由新到舊排序，
     * 可查看會員、到期時間與是否已用於訂單。
     */
    @GetMapping("/{couponId}/grants")
    public Page<AdminCouponGrantResponse> getCouponGrantHistory(
            @PathVariable Long couponId,
            @ParameterObject
            @PageableDefault(
                    size = 20,
                    sort = "receivedAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return adminCouponService.getCouponGrantHistory(
                couponId,
                pageable
        );
    }

    /**
     * 新增一種折價券範本。
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminCouponListResponse createCoupon(
            @Valid @RequestBody CreateCouponRequest request
    ) {
        return adminCouponService.createCoupon(request);
    }

    /**
     * 停止或重新啟用一種折價券。
     */
    @PatchMapping("/{couponId}/active")
    public AdminCouponListResponse updateCouponActive(
            @PathVariable Long couponId,
            @Valid @RequestBody UpdateCouponActiveRequest request
    ) {
        return adminCouponService.updateCouponActive(
                couponId,
                request
        );
    }

    /**
     * 發一張折價券給指定會員。
     *
     * 發放資料中的 couponId 是折價券範本 id，
     * memberEmail 是要接收該券的會員。
     */
    @PostMapping("/grants")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void grantCouponToMember(
            @Valid @RequestBody GrantCouponToMemberRequest request
    ) {
        adminCouponService.grantCouponToMember(request);
    }
}