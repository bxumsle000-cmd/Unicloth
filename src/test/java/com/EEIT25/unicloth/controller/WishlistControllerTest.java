package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.wishlist.WishlistItemResponse;
import com.EEIT25.unicloth.service.WishlistService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 只測 Controller：網址、HTTP 方法、狀態碼、JSON 格式對不對。
 * Service 換成假的（mock），不碰資料庫。
 */
@WebMvcTest(WishlistController.class)
class WishlistControllerTest {

    @Autowired MockMvc mockMvc;

    @MockitoBean WishlistService wishlistService;

    @Test
    void 取得追蹤清單_回傳JSON陣列() throws Exception {
        when(wishlistService.getWishlist()).thenReturn(List.of(
                new WishlistItemResponse("men-487511", "DRY-EX防曬連帽外套", 990, "img/a.jpg", true)));

        mockMvc.perform(get("/api/wishlist"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].slug").value("men-487511"))
                .andExpect(jsonPath("$[0].imageUrl").value("img/a.jpg"))
                .andExpect(jsonPath("$[0].onSale").value(true));
    }

    @Test
    void 加入追蹤_回傳204() throws Exception {
        mockMvc.perform(post("/api/wishlist/men-487511"))
                .andExpect(status().isNoContent());
        verify(wishlistService).add("men-487511");
    }

    @Test
    void 取消追蹤_回傳204() throws Exception {
        mockMvc.perform(delete("/api/wishlist/men-487511"))
                .andExpect(status().isNoContent());
        verify(wishlistService).remove("men-487511");
    }
}
