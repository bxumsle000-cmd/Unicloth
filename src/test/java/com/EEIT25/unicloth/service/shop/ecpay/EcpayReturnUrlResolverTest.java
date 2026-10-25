package com.EEIT25.unicloth.service.shop.ecpay;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * ReturnURL 自動抓 tunnel 網址的測試（不用啟動 Spring）。
 */
class EcpayReturnUrlResolverTest {

    private static final String TUNNEL_API_URL = "http://127.0.0.1:20241/quicktunnel";

    @Test
    void 有手動設定網址_直接用手動的() {
        EcpayReturnUrlResolver resolver = new EcpayReturnUrlResolver(
                "https://fixed.example.com/api/payments/ecpay/notify", TUNNEL_API_URL);

        assertEquals("https://fixed.example.com/api/payments/ecpay/notify", resolver.resolve());
    }

    @Test
    void tunnel沒開_退回localhost() {
        // port 1 一定連不上，模擬 tunnel 沒開
        EcpayReturnUrlResolver resolver = new EcpayReturnUrlResolver("", "http://127.0.0.1:1/quicktunnel");

        assertEquals("http://localhost:8080/api/payments/ecpay/notify", resolver.resolve());
    }

    @Test
    void tunnel有開_用tunnel目前的網址() {
        // 這個測試需要 docker compose up -d tunnel，沒開就跳過
        // tunnel 回的是 text/plain，所以拿字串自己取 hostname
        String hostname;
        try {
            String body = RestClient.create().get().uri(TUNNEL_API_URL).retrieve().body(String.class);
            Matcher matcher = Pattern.compile("\"hostname\":\"([^\"]+)\"").matcher(body);
            hostname = matcher.find() ? matcher.group(1) : null;
        } catch (Exception e) {
            hostname = null;
        }
        assumeTrue(hostname != null && !hostname.isBlank(), "tunnel 沒開，跳過");

        EcpayReturnUrlResolver resolver = new EcpayReturnUrlResolver("", TUNNEL_API_URL);

        assertEquals("https://" + hostname + "/api/payments/ecpay/notify", resolver.resolve());
    }
}
