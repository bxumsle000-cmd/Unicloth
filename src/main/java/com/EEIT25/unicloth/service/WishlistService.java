package com.EEIT25.unicloth.service;


import com.EEIT25.unicloth.dto.wishlist.WishlistItemResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.entity.WishlistItem;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.WishlistItemRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 追蹤清單（愛心）相關服務，都是針對目前登入的會員<br>
 * - {@link #getWishlist()}：我的追蹤清單<br>
 * - {@link #add(String)}：追蹤商品<br>
 * - {@link #remove(String)}：取消追蹤<br>
 * - {@link #isInWishlist(String)}：某商品是否已追蹤
 */
@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final CurrentMember currentMember;

    /** 我的追蹤清單，最新追蹤的在前面 */
    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getWishlist(){
        Member member = currentMember.require();

        return wishlistItemRepository.findWishlistWithProducts(member.getId())
                .stream()
                .map(wishlistItem -> WishlistItemResponse.from(wishlistItem))
                .toList();
    }

    /** 追蹤商品（只能追蹤上架中的）；已經追蹤過就直接略過 */
    @Transactional
    public void add(String slug){
        Member member = currentMember.require();

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
        Member member = currentMember.require();

        wishlistItemRepository.deleteByMemberIdAndProductSlug(member.getId(), slug);
    }

    /** 商品頁愛心要不要亮：這件商品是否已追蹤 */
    @Transactional
    public boolean isInWishlist(String slug){
        Member member = currentMember.require();

        return wishlistItemRepository.existsByMemberIdAndProductSlug(member.getId(), slug);
    }


}
