import { money, imgSrc } from "../js/kinu.js";
import { CiHeart } from "react-icons/ci";

/** 商品卡片：product 是 /api/categories/{code}/products 回來 content 裡的一筆 */
function ProductCard({ product }) {
    // 有原價而且比售價高，就顯示成特價
    const onSaleNow = product.origPrice && product.origPrice > product.price;

    return (
        <div className="relative">
                {/* 商品圖 */}
                <div className="relative aspect-[3/4]  bg-[#F0EBE3]">
                    {product.imageUrl && (
                        <img src={imgSrc(product.imageUrl)} alt={product.name} loading="lazy"
                                                            className="mix-blend-multiply
                                                            transition-transform duration-500 hover:scale-[1.03]" />
                    )}

                    {/* 左上角標籤 */}
                    <div className="absolute top-2.5 left-2.5 flex gap-[5px]">
                        {product.newArrival && <span className="bg-white px-[7px] py-1 text-[8px] tracking-[.15em]">NEW</span>}
                        {product.hot && <span className="bg-black px-[7px] py-1 text-[8px] tracking-[.15em] text-white">HOT</span>}
                    </div>
                </div>

                {/* 名稱 */}
                <div className="mt-3 mb-[5px] text-[14px] leading-[1.6] tracking-[.04em]">{product.name}</div>

                {/* 價格：特價時售價變紅，原價加刪除線 */}
                <div className={`text-xs tracking-[.05em] ${onSaleNow ? "text-[#9a3b2d]" : ""}`}>
                    {onSaleNow && <del className="ml-[7px] text-[11px] text-[#76716c]">{money(product.origPrice)}</del>}
                    {money(product.price)}
                </div>


            {/* 收藏愛心（目前只有外觀） */}
            <button aria-label="收藏"
                    className="absolute top-1.5 right-1.5  grid size-[34px] place-items-center rounded-full bg-[#ffffffcc]">
                <CiHeart className="size-[19px]" />
            </button>
        </div>
    )
}

export default ProductCard;
