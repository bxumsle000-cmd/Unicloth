package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.wishlist.WishlistItemResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.Product;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.ProductRepository;
import com.EEIT25.unicloth.repository.WishlistItemRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * 追蹤清單的行為測試（連真的資料庫）。
 * 每個測試結束都會 rollback，不會留下資料。<br>
 * CurrentMember 目前寫死 id=1，資料庫不一定有這個會員，所以測試自己建一個臨時會員，
 * 再把 CurrentMember 換成假的（mock），讓它回傳這個會員的 id。
 */
@SpringBootTest
@Transactional
class WishlistServiceTest {

    @Autowired WishlistService wishlistService;
    @Autowired WishlistItemRepository wishlistItemRepository;
    @Autowired ProductRepository productRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired EntityManager em;

    @MockitoBean CurrentMember currentMember;

    Member member;
    Product product;

    @BeforeEach
    void setUp() {
        member = memberRepository.save(Member.builder()
                .email("wishlist-test@example.com")
                .passwordHash("x")
                .name("測試會員")
                .phone("0900000000")
                .gender("male")
                .birthday(LocalDate.of(2000, 1, 1))
                .build());
        when(currentMember.getCurrentId()).thenReturn(member.getId());

        // 隨便挑一件上架中的商品
        product = productRepository.findAll().stream()
                .filter(p -> "on_sale".equals(p.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("資料庫沒有上架中的商品，無法測試"));
    }

    /** 清單中這件商品出現幾次 */
    private long countInWishlist(String slug) {
        return wishlistService.getWishlist().stream()
                .filter(w -> w.slug().equals(slug))
                .count();
    }

    /** 把商品下架，並寫進資料庫 */
    private void takeOffShelf(Product p) {
        p.setStatus("off_shelf");
        em.flush();
    }

    @Test
    void 重複加入同一件商品_不會出錯且只有一筆() {
        wishlistService.add(product.getSlug());
        assertDoesNotThrow(() -> wishlistService.add(product.getSlug()));

        em.flush();   // 真的送到資料庫，UNIQUE 有問題會在這裡爆
        assertEquals(1, countInWishlist(product.getSlug()));
    }

    @Test
    void 取消追蹤本來就沒追蹤的商品_不會出錯() {
        assertDoesNotThrow(() -> wishlistService.remove(product.getSlug()));
        assertEquals(0, countInWishlist(product.getSlug()));
    }

    @Test
    void 商品下架後_清單還看得到且onSale為false() {
        wishlistService.add(product.getSlug());
        takeOffShelf(product);

        List<WishlistItemResponse> items = wishlistService.getWishlist().stream()
                .filter(w -> w.slug().equals(product.getSlug()))
                .toList();

        assertEquals(1, items.size());
        assertFalse(items.get(0).onSale());
    }

    @Test
    void 下架的商品_還能取消追蹤() {
        wishlistService.add(product.getSlug());
        takeOffShelf(product);

        wishlistService.remove(product.getSlug());
        em.flush();

        assertEquals(0, countInWishlist(product.getSlug()));
        assertFalse(wishlistItemRepository.existsByMemberIdAndProductId(member.getId(), product.getId()));
    }
}
