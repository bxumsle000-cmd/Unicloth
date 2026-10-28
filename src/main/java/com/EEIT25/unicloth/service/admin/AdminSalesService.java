package com.EEIT25.unicloth.service.admin;

import com.EEIT25.unicloth.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.time.LocalDate;
import java.util.Optional;
import java.util.function.Function;

/**
 * 銷售數據：自己不算，轉給 Python 分析服務（analytics/main.py）算好再原樣回傳<br>
 * Python 只開在本機，前端連不到，所以權限都在 Spring Boot 這邊擋（SecurityConfig 擋 /api/admin/mkt/**）
 */
@Slf4j
@Service
public class AdminSalesService {
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AdminSalesService(@Value("${analytics.base-url}") String baseUrl, ObjectMapper objectMapper) {
        this.restClient = RestClient.create(baseUrl);
        this.objectMapper = objectMapper;
    }

    /** 營收總覽：range = 7d / 30d / 90d / 12m，回傳 Python 算好的 JSON 字串 */
    public String getOverview(String range) {
        return get(uri -> uri.path("/sales/overview").queryParam("range", range).build(), String.class);
    }

    /** 營收總覽匯出 Excel（含頭尾兩天），回傳 .xlsx 檔案內容 */
    public byte[] exportOverview(LocalDate start, LocalDate end) {
        return get(uri -> uri.path("/sales/overview/export")
                .queryParam("start", start)
                .queryParam("end", end)
                .build(), byte[].class);
    }

    /** 商品銷售：range = 7d / 30d / 90d / 12m；mainId、subId 是主分類、副分類的 id，null = 不篩選 */
    public String getProductSales(String range, Long mainId, Long subId) {
        return get(uri -> uri.path("/sales/products")
                .queryParam("range", range)
                .queryParamIfPresent("main", Optional.ofNullable(mainId))
                .queryParamIfPresent("sub", Optional.ofNullable(subId))
                .build(), String.class);
    }

    /** 商品排行的其中一頁：type = hot / slow；page 從 0 開始；range、mainId、subId 跟商品銷售一樣 */
    public String getProductRank(String range, Long mainId, Long subId, String type, int page) {
        return get(uri -> uri.path("/sales/products/rank")
                .queryParam("range", range)
                .queryParamIfPresent("main", Optional.ofNullable(mainId))
                .queryParamIfPresent("sub", Optional.ofNullable(subId))
                .queryParam("type", type)
                .queryParam("page", page)
                .build(), String.class);
    }

    /** 訂單結構：range = 7d / 30d / 90d / 12m；shipping = HOME / CVS，null = 不篩選 */
    public String getOrderStructure(String range, String shipping) {
        return get(uri -> uri.path("/sales/orders")
                .queryParam("range", range)
                .queryParamIfPresent("shipping", Optional.ofNullable(shipping))
                .build(), String.class);
    }

    /** 會員與顧客：range = 7d / 30d / 90d / 12m；gender = female / male；age = u24 / 25-34 / 35-44 / 45up；null = 不篩選 */
    public String getMemberCustomers(String range, String gender, String age) {
        return get(uri -> uri.path("/sales/members")
                .queryParam("range", range)
                .queryParamIfPresent("gender", Optional.ofNullable(gender))
                .queryParamIfPresent("age", Optional.ofNullable(age))
                .build(), String.class);
    }

    /** 折價券成效：range = 7d / 30d / 90d / 12m */
    public String getCouponPerformance(String range) {
        return get(uri -> uri.path("/sales/coupons").queryParam("range", range).build(), String.class);
    }

    /**
     * 呼叫 Python，把出錯的情況換成前端看得懂的訊息：
     * 參數不對（400）→ 用 Python 回的 message；Python 沒開 → 503；其他 → 502
     */
    private <T> T get(Function<UriBuilder, URI> uriFunction, Class<T> bodyType) {
        try {
            return restClient.get()
                    .uri(uriFunction)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
                        throw ApiException.badRequest(readMessage(response.getBody().readAllBytes()));
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (request, response) -> {
                        throw new ApiException(HttpStatus.BAD_GATEWAY, "銷售分析服務出錯了，請看 Python 那邊的錯誤訊息");
                    })
                    .body(bodyType);
        } catch (ResourceAccessException e) {
            log.warn("連不到 Python 分析服務：{}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "銷售分析服務沒有啟動，請執行 docker compose up -d");
        }
    }

    /** Python 回的錯誤是 {"code": 400, "message": "..."}；FastAPI 自己擋下的（例如日期格式錯）沒有 message，用預設的 */
    private String readMessage(byte[] body) {
        try {
            String message = objectMapper.readTree(body).path("message").asString();
            return message.isBlank() ? "查詢條件格式錯誤" : message;
        } catch (Exception e) {
            return "查詢條件格式錯誤";
        }
    }
}
