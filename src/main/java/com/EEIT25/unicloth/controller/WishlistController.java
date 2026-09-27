package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.wishlist.WishlistItemResponse;
import com.EEIT25.unicloth.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/wishlist")
public class WishlistController {
    private final WishlistService wishlistService;

    /** 我的追蹤清單，最新追蹤的在前面 */
    @GetMapping
    public List<WishlistItemResponse> getWishlist(){
        return wishlistService.getWishlist();
    }

    /** 加入追蹤 */
    @PostMapping("/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@PathVariable String slug){
        wishlistService.add(slug);
    }

    /** 取消追蹤 */
    @DeleteMapping("/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable String slug){
        wishlistService.remove(slug);
    }
}
