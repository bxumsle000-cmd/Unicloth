package com.EEIT25.unicloth.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * React 前端頁面的網址（例如 /cart）在瀏覽器重新整理時會直接打到後端，
 * 這裡把它們轉給 index.html，再由 React Router 決定顯示哪一頁。
 */
@Controller
public class SpaForwardController {

    @GetMapping({
            "/new-arrivals", "/category/{code}", "/wishlist", "/product/{slug}",
            "/coupons", "/cart", "/checkout", "/order-complete", "/search",
            "/orders", "/support", "/shipping-returns", "/faq", "/recommendations",
            "/member/**", "/login", "/complete-profile", "/admin/**"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
