import { money, imgSrc } from "../js/kinu.js";
import { IoHeart } from "react-icons/io5";

/** 收藏卡片：list 是 /api/wishlist 回來的一筆；onRemove 是按愛心要做的事（取消收藏） */
function WishListCard({ list, remove }) {

    return (
        <div className="relative">
            {/* 商品圖 */}
            <div className="relative aspect-[3/4] overflow-hidden bg-[#F0EBE3]">
                {list.imageUrl && (
                    <img src={imgSrc(list.imageUrl)} alt={list.name} loading="lazy"
                         className={`mix-blend-multiply transition-transform duration-500 hover:scale-[1.03]
                                     ${list.onSale ? "" : "opacity-40 grayscale"}`} />
                )}

                {/* 下架商品蓋一層標籤 */}
                {!list.onSale && (
                    <span className="absolute inset-x-0 bottom-0 bg-[#000000b3] py-2 text-center text-[11px] tracking-[.2em] text-white">
                        已下架
                    </span>
                )}
            </div>

            {/* 名稱 */}
            <div className={`mt-3 mb-[5px] text-[14px] leading-[1.6] tracking-[.04em] ${list.onSale ? "" : "text-[#9a948d]"}`}>
                {list.name}
            </div>

            {/* 價格 */}
            <div className="text-xs tracking-[.05em]">
                {money(list.price)}
            </div>

            {/* 收藏愛心：已收藏所以是實心，按下去取消收藏 */}
            <button aria-label="取消收藏"
                    onClick={() => remove(list.slug)}
                    className="absolute top-1.5 right-1.5 grid size-[34px] place-items-center rounded-full bg-[#ffffffcc]">
                <IoHeart className="size-[18px] text-[#9a3b2d]" />
            </button>
        </div>
    )
}

export default WishListCard;
