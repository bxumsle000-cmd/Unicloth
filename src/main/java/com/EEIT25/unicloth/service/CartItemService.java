package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.cartItem.AddCartItemRequest;
import com.EEIT25.unicloth.dto.cartItem.CartItemResponse;
import com.EEIT25.unicloth.dto.cartItem.ChangeCartItemQtyRequest;
import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.enums.ProductStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CartItemRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 購物車相關服務，都是針對目前登入的會員<br>
 * - {@link #getCartItems()}：我的購物車<br>
 * - {@link #add(AddCartItemRequest)}：加入購物車<br>
 * - {@link #changeQty(ChangeCartItemQtyRequest)}：修改數量<br>
 * - {@link #remove(Long)}：移除購物車項目
 */
@Service
@RequiredArgsConstructor
public class CartItemService {
    private final CartItemRepository cartItemRepository;
    private final CurrentMember currentMember;
    private final ProductVariantRepository productVariantRepository;

    /** 我的購物車，先加入的在前面 */
    @Transactional(readOnly = true)
    public List<CartItemResponse> getCartItems(){
        List<CartItem> cartList = cartItemRepository.findCartWithProducts(currentMember.getCurrentId());
        return cartList.stream()
                .map(cartItem -> CartItemResponse.from(cartItem))
                .toList();
    }

    /**
     * 加入購物車（以 SKU 為單位）。<br>
     * 購物車裡已經有同一個 SKU 就把數量加上去，沒有才新增一筆；商品要上架中，加完的總數不能超過庫存。
     */
    @Transactional
    public void add(AddCartItemRequest request){
        Member member = currentMember.require();
        ProductVariant productVariant = productVariantRepository.findById(request.variantId())
                .orElseThrow(()-> ApiException.notFound("沒有找到商品"));
        if(productVariant.getProduct().getStatus() != ProductStatus.ON_SALE){
            throw ApiException.conflict("商品已下架");
        }

        Optional<CartItem> cartItemOptional = cartItemRepository.findByMemberAndVariant(member,productVariant);

        // 要比的是「加完之後的總數」：購物車原本有的 + 這次要加的
        int currentQty = cartItemOptional.map(CartItem::getQty).orElse(0);
        if(productVariant.getStock() < currentQty + request.qty()){
            throw ApiException.conflict("不能超過庫存數量");
        }

        if(cartItemOptional.isEmpty()){
            CartItem cartItem = CartItem.builder()
                    .member(member)
                    .variant(productVariant)
                    .qty(request.qty())
                    .build();
            cartItemRepository.save(cartItem);
        }else{
            CartItem cartItem = cartItemOptional.get();
            cartItem.setQty(cartItem.getQty() + request.qty());
        }
    }

    /** 把某個購物車項目的數量直接改成指定值（不是加減）；只能改自己的，不能超過庫存 */
    @Transactional
    public void changeQty(ChangeCartItemQtyRequest request){
        Member member = currentMember.require();

        CartItem cartItem = cartItemRepository.findByIdAndMember(request.cartItemId(), member)
                .orElseThrow(()->ApiException.notFound("找不到購物車編號"));

        ProductVariant productVariant = cartItem.getVariant();

        if(productVariant.getStock()<request.qty()){
            throw ApiException.conflict("不能超過庫存數量");
        }
        cartItem.setQty(request.qty());
    }

    /** 移除購物車項目；只會刪到自己的，編號不存在也不會報錯 */
    @Transactional
    public void remove(Long cartItemId){
        Member member = currentMember.require();

        cartItemRepository.deleteByIdAndMember(cartItemId,member);
    }
}
