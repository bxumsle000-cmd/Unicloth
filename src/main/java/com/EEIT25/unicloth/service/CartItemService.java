package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.cartItem.AddCartItemRequest;
import com.EEIT25.unicloth.dto.cartItem.CartItemResponse;
import com.EEIT25.unicloth.dto.cartItem.ChangeCartItemQtyRequest;
import com.EEIT25.unicloth.entity.CartItem;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.ProductVariant;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.CartItemRepository;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartItemService {
    private final CartItemRepository cartItemRepository;
    private final MemberRepository memberRepository;
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

    @Transactional
    public void add(AddCartItemRequest request){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(() -> ApiException.unauthorized("登入過期或失效"));
        ProductVariant productVariant = productVariantRepository.findById(request.variantId())
                .orElseThrow(()-> ApiException.notFound("沒有找到商品"));
        if(!"on_sale".equals(productVariant.getProduct().getStatus())){
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

    @Transactional
    public void changeQty(ChangeCartItemQtyRequest request){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(() -> ApiException.unauthorized("登入過期或失效"));

        CartItem cartItem = cartItemRepository.findByIdAndMember(request.cartItemId(), member)
                .orElseThrow(()->ApiException.notFound("找不到購物車編號"));

        ProductVariant productVariant = cartItem.getVariant();

        if(productVariant.getStock()<request.qty()){
            throw ApiException.conflict("不能超過庫存數量");
        }
        cartItem.setQty(request.qty());
    }

    @Transactional
    public void remove(Long cartItemId){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(() -> ApiException.unauthorized("登入過期或失效"));

        cartItemRepository.deleteByIdAndMember(cartItemId,member);
    }
}
