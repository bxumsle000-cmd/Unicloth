import { money, imgSrc } from "../../js/kinu.js";
import { CiHeart } from "react-icons/ci";
import { IoHeart } from "react-icons/io5";
import { Link } from "react-router-dom";

/**
 * 商品卡片：product 是商品列表 API 回傳的一筆資料。
 * liked 表示是否已收藏；toggleLike 是按愛心時執行的功能。
 */
function ProductCard({ product, liked, toggleLike }) {
    // 有原價而且比售價高，就顯示成特價
    const onSaleNow =
        product.origPrice &&
        product.origPrice > product.price;

    return (
        <div className="relative">
            {/* 點圖片或名稱進商品頁 */}
            <Link to={`/product/${product.slug}`}>
                {/* 商品圖 */}
                <div className="relative aspect-[3/4] bg-[#F0EBE3]">
                    {product.imageUrl && (
                        <img
                            src={imgSrc(product.imageUrl)}
                            alt={product.name}
                            loading="lazy"
                            className="mix-blend-multiply transition-transform duration-500 hover:scale-[1.03]"
                        />
                    )}

                    {/* 左上角標籤 */}
                    <div className="absolute top-2.5 left-2.5 flex gap-[5px]">
                        {product.newArrival && (
                            <span className="bg-white px-[7px] py-1 text-[8px] tracking-[.15em]">
                                NEW
                            </span>
                        )}

                        {product.hot && (
                            <span className="bg-black px-[7px] py-1 text-[8px] tracking-[.15em] text-white">
                                HOT
                            </span>
                        )}
                    </div>
                </div>

                {/* 商品名稱 */}
                <div className="mt-3 mb-[5px] text-[14px] leading-[1.6] tracking-[.04em]">
                    {product.name}
                </div>

                {/* 最多顯示三個風格標籤 */}
                {product.styles?.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                        {product.styles
                            .slice(0, 3)
                            .map(style => (
                                <span
                                    key={style.id}
                                    className="border border-line bg-white px-2 py-1 text-[9px] tracking-[.08em] text-muted"
                                >
                                    {style.name}
                                </span>
                            ))}
                    </div>
                )}

                {/* 價格：特價時售價變紅，原價加刪除線 */}
                <div
                    className={
                        "text-xs tracking-[.05em] " +
                        (onSaleNow
                            ? "text-[#9a3b2d]"
                            : "")
                    }
                >
                    {onSaleNow && (
                        <del className="ml-[7px] text-[11px] text-[#76716c]">
                            {money(product.origPrice)}
                        </del>
                    )}

                    {money(product.price)}
                </div>
            </Link>

            {/* 收藏愛心：已收藏是紅色實心，沒收藏是空心 */}
            <button
                aria-label={
                    liked ? "取消收藏" : "收藏"
                }
                onClick={() =>
                    toggleLike(product.slug)
                }
                className="absolute top-1.5 right-1.5 grid size-[34px] place-items-center rounded-full bg-[#ffffffcc]"
            >
                {liked ? (
                    <IoHeart className="size-[18px] text-[#9a3b2d]" />
                ) : (
                    <CiHeart className="size-[19px]" />
                )}
            </button>
        </div>
    );
}

export default ProductCard;