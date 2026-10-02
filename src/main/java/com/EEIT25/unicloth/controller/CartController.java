package com.EEIT25.unicloth.controller;

import com.EEIT25.unicloth.dto.cartItem.AddCartItemRequest;
import com.EEIT25.unicloth.dto.cartItem.CartItemResponse;
import com.EEIT25.unicloth.dto.cartItem.ChangeCartItemQtyRequest;
import com.EEIT25.unicloth.service.CartItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart")
public class CartController {
    private final CartItemService cartItemService;

    /** 我的購物車，先加入的在前面 */
    @GetMapping
    public List<CartItemResponse> getCartItems(){
        return cartItemService.getCartItems();
    }

    /** 加入購物車；同一個 SKU 已在購物車就累加數量 */
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@Valid @RequestBody AddCartItemRequest request){
        cartItemService.add(request);
    }

    /** 購物車頁改數量（直接設定成新數量，不是累加） */
    @PatchMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeQty(@Valid @RequestBody ChangeCartItemQtyRequest request){
        cartItemService.changeQty(request);
    }

    /** 從購物車移除一筆 */
    @DeleteMapping("/{cartItemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long cartItemId){
        cartItemService.remove(cartItemId);
    }
}
