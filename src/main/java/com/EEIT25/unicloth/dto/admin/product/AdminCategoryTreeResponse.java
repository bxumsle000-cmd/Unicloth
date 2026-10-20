package com.EEIT25.unicloth.dto.admin.product;

import java.util.List;

/**
 * 後台分類管理使用的分類樹節點。
 *
 * children 裡可以繼續放下一層分類，
 * 因此能支援兩層、三層或更多層。
 */
public record AdminCategoryTreeResponse(

        Long id,

        String name,

        String code,

        String iconUrl,

        /**
         * 直接歸在這個分類下的商品數量。
         */
        Long directProductCount,

        /**
         * 這個分類和所有子分類的商品總數。
         */
        Long totalProductCount,

        List<AdminCategoryTreeResponse> children

) {
}