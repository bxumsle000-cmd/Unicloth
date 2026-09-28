package com.EEIT25.unicloth.dto.category;

import java.util.List;

/**
 * 商品列表的篩選條件（都是選填，沒帶就是不篩）<br>
 * 網址例：?colors=黑色&colors=白色&sizes=M&minPrice=500&maxPrice=1500
 *
 * @param colors   顏色，多選時「其中一個符合」就算（值用 /filters 回傳的原樣）
 * @param sizes    尺寸，多選時「其中一個符合」就算
 * @param minPrice 最低售價（含）
 * @param maxPrice 最高售價（含）
 */
public record ProductFilterRequest(
        List<String> colors,
        List<String> sizes,
        Integer minPrice,
        Integer maxPrice
) {
}
