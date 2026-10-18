package com.EEIT25.unicloth.service.ecpay;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 決定要給綠界的 ReturnURL（付款結果通知網址）。<br>
 * 綠界的伺服器連不到 localhost，所以要用 docker-compose 裡的 Cloudflare Tunnel 對外網址。
 * 免費 tunnel 每次啟動網址都會變，所以每次建立付款都重新問 tunnel 目前的網址，不用手動設定。<br>
 * 順序：
 * <ol>
 *   <li>有設定 ECPAY_RETURN_URL（ecpay.return-url）→ 直接用它</li>
 *   <li>問 tunnel 的 /quicktunnel 拿目前網址 → https://網址/api/payments/ecpay/notify</li>
 *   <li>tunnel 沒開 → 退回 localhost（綠界通知不會進來，只能測到跳轉付款頁）</li>
 * </ol>
 */
@Slf4j
@Component
public class EcpayReturnUrlResolver {

    private static final String NOTIFY_PATH = "/api/payments/ecpay/notify";
    private static final String LOCALHOST_RETURN_URL = "http://localhost:8080" + NOTIFY_PATH;

    // tunnel 回傳的格式：{"hostname":"xxxx.trycloudflare.com"}
    private static final Pattern HOSTNAME_PATTERN =
            Pattern.compile("\"hostname\"\\s*:\\s*\"([A-Za-z0-9.-]+)\"");

    private final String fixedReturnUrl;
    private final String tunnelApiUrl;
    private final RestClient restClient;

    public EcpayReturnUrlResolver(
            @Value("${ecpay.return-url:}") String fixedReturnUrl,
            @Value("${ecpay.tunnel-api-url}") String tunnelApiUrl
    ) {
        this.fixedReturnUrl = fixedReturnUrl;
        this.tunnelApiUrl = tunnelApiUrl;

        // tunnel 沒開時要很快失敗，不要卡住結帳
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(2));
        requestFactory.setReadTimeout(Duration.ofSeconds(2));
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    public String resolve() {
        // 1. 有手動設定就用手動的
        if (fixedReturnUrl != null && !fixedReturnUrl.isBlank()) {
            log.info("ECPay ReturnURL (from ECPAY_RETURN_URL): {}", fixedReturnUrl);
            return fixedReturnUrl;
        }

        // 2. 問 tunnel 目前的網址
        //    tunnel 回的 Content-Type 是 text/plain（不是 JSON），Spring 不會自動轉成物件，
        //    所以先拿字串，再自己取出 hostname
        try {
            String body = restClient.get()
                    .uri(tunnelApiUrl)
                    .retrieve()
                    .body(String.class);

            // 只接受正常的網域字元，避免拼出奇怪的網址
            Matcher matcher = HOSTNAME_PATTERN.matcher(body == null ? "" : body);
            if (matcher.find()) {
                String returnUrl = "https://" + matcher.group(1) + NOTIFY_PATH;
                log.info("ECPay ReturnURL (from tunnel): {}", returnUrl);
                return returnUrl;
            }

            log.warn("ECPay tunnel returned no hostname: {}", tunnelApiUrl);
        } catch (Exception e) {
            log.warn("ECPay tunnel not reachable ({}): {}", tunnelApiUrl, e.getMessage());
        }

        // 3. tunnel 沒開
        log.warn("ECPay ReturnURL falls back to localhost, payment notification will NOT arrive. "
                + "Run: docker compose up -d tunnel");
        return LOCALHOST_RETURN_URL;
    }
}
