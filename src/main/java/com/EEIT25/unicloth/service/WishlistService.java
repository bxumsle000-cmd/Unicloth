package com.EEIT25.unicloth.service;


import com.EEIT25.unicloth.dto.wishlist.WishlistItemResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.WishlistItem;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.WishlistItemRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final MemberRepository memberRepository;
    private final CurrentMember currentMember;

    /** 我的追蹤清單，最新追蹤的在前面 */
    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getWishlist(){
        return wishlistItemRepository.findWishlistWithProducts(currentMember.getCurrentId())
                .stream()
                .map(wishlistItem -> WishlistItemResponse.from(wishlistItem))
                .toList();
    }

    @Transactional
    public void add(String slug){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(()-> ApiException.unauthorized("登入過期或失效"));

        Product product = productRepository.findOnSaleBySlug(slug)
                .orElseThrow(()-> ApiException.notFound("找不到商品:"+slug));

        // 已經追蹤過就不用再存（資料庫有 UNIQUE，重複存會變 500）
        if (wishlistItemRepository.existsByMemberIdAndProductId(member.getId(), product.getId())) {
            return;
        }

        WishlistItem wishlistItem = WishlistItem.builder()
                .member(member)
                .product(product)
                .build();
        wishlistItemRepository.save(wishlistItem);
    }

    /** 取消追蹤；本來就沒追蹤也不會報錯 */
    @Transactional
    public void remove(String slug){
        wishlistItemRepository.deleteByMemberIdAndProductSlug(currentMember.getCurrentId(), slug);
    }

    /** 商品頁愛心要不要亮：這件商品是否已追蹤 */
    @Transactional
    public boolean isInWishlist(String slug){
        return wishlistItemRepository.existsByMemberIdAndProductSlug(currentMember.getCurrentId(), slug);
    }


}
