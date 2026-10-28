package com.EEIT25.unicloth.controller.admin;

import com.EEIT25.unicloth.service.admin.AdminSalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * 行銷後台的銷售數據（只有 MKT、ADMIN 能用，SecurityConfig 擋 /api/admin/mkt/**）<br>
 * 數字由 Python 分析服務算，這裡只負責擋權限、轉送
 */
@RestController
@RequestMapping("/api/admin/mkt/sales")
@RequiredArgsConstructor
public class AdminMktSalesController {
    private final AdminSalesService adminSalesService;

    /** 營收總覽：range = 7d / 30d / 90d / 12m（格式見 analytics/sales_overview.py 的 get_overview） */
    @GetMapping(value = "/overview", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getOverview(@RequestParam(defaultValue = "30d") String range) {
        return adminSalesService.getOverview(range);
    }

    /** 營收總覽匯出 Excel：每天一列，start、end 格式 2026-10-01（含頭尾） */
    @GetMapping("/overview/export")
    public ResponseEntity<byte[]> exportOverview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        String fileName = "sales-overview_" + start + "_" + end + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(adminSalesService.exportOverview(start, end));
    }

    /** 商品銷售：range = 7d / 30d / 90d / 12m；main、sub 是主分類、副分類的 id，不帶就是全部（格式見 analytics/product_sales.py） */
    @GetMapping(value = "/products", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getProductSales(@RequestParam(defaultValue = "30d") String range,
                                  @RequestParam(required = false) Long main,
                                  @RequestParam(required = false) Long sub) {
        return adminSalesService.getProductSales(range, main, sub);
    }

    /**
     * 商品排行的其中一頁（每頁 10 件，都依件數排）：type = hot（熱銷）/ slow（滯銷）；page 從 0 開始
     * range、main、sub 跟 /products 一樣（格式見 analytics/product_sales.py 的 get_product_rank）
     */
    @GetMapping(value = "/products/rank", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getProductRank(@RequestParam(defaultValue = "30d") String range,
                                 @RequestParam(required = false) Long main,
                                 @RequestParam(required = false) Long sub,
                                 @RequestParam(defaultValue = "hot") String type,
                                 @RequestParam(defaultValue = "0") int page) {
        return adminSalesService.getProductRank(range, main, sub, type, page);
    }

    /** 訂單結構：range = 7d / 30d / 90d / 12m；shipping = HOME / CVS，不帶就是全部（格式見 analytics/order_structure.py） */
    @GetMapping(value = "/orders", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getOrderStructure(@RequestParam(defaultValue = "30d") String range,
                                    @RequestParam(required = false) String shipping) {
        return adminSalesService.getOrderStructure(range, shipping);
    }

    /**
     * 會員與顧客：range = 7d / 30d / 90d / 12m；gender = female / male；age = u24 / 25-34 / 35-44 / 45up，不帶就是全部
     * （格式見 analytics/member_customers.py）
     */
    @GetMapping(value = "/members", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getMemberCustomers(@RequestParam(defaultValue = "30d") String range,
                                     @RequestParam(required = false) String gender,
                                     @RequestParam(required = false) String age) {
        return adminSalesService.getMemberCustomers(range, gender, age);
    }

    /** 折價券成效：range = 7d / 30d / 90d / 12m（格式見 analytics/coupon_performance.py） */
    @GetMapping(value = "/coupons", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getCouponPerformance(@RequestParam(defaultValue = "30d") String range) {
        return adminSalesService.getCouponPerformance(range);
    }
}
