import { Link } from "react-router-dom";
import { money, imgSrc } from "../../js/kinu.js";

/**
 * 購物車的一筆：item 是 /api/cart 回來的一筆
 * changeQty(item, 新數量)、remove(item) 是按鈕要做的事
 */
function CartItem({ item, changeQty, remove }) {
    // 下架商品不連到商品頁（商品頁會 404）
    const image = (
        <img src={imgSrc(item.imageUrl)} alt={item.name}
             className={`size-full object-cover mix-blend-multiply ${item.onSale ? "" : "opacity-40 grayscale"}`} />
    );

    return (
        <div className="flex gap-6 border-b border-[#e5e0d8] py-6 max-[760px]:gap-4">
            {/* 商品圖 */}
            <div className="aspect-[3/4] w-[110px] shrink-0 bg-[#F0EBE3] max-[760px]:w-[84px]">
                {item.onSale ? <Link to={`/product/${item.slug}`}>{image}</Link> : image}
            </div>

            <div className="flex flex-1 flex-col">
                {/* 名稱 + 小計 */}
                <div className="flex items-start justify-between gap-4">
                    <div className="text-[13px] leading-[1.6] tracking-[.04em]">
                        {item.onSale
                            ? <Link to={`/product/${item.slug}`}>{item.name}</Link>
                            : <span className="text-[#9a948d]">{item.name}</span>}
                    </div>
                    <div className="text-[13px] tracking-[.05em] whitespace-nowrap">{money(item.price * item.qty)}</div>
                </div>

                {/* 顏色 / 尺寸 · 單價 */}
                <div className="mt-1.5 text-[11px] tracking-[.06em] text-[#76716c]">
                    {item.color}<span className="mx-2">/</span>{item.size}<span className="mx-2">·</span>{money(item.price)}
                </div>

                {/* 數量：上限是庫存；下架商品只能移除 */}
                {item.onSale ? (
                    <div className="mt-4 inline-flex h-[38px] w-fit items-center border border-[#d6d0c7]">
                        <button aria-label="減少" disabled={item.qty <= 1}
                                onClick={() => changeQty(item, item.qty - 1)}
                                className="w-9 text-[16px] disabled:text-[#c4bdb4]">−</button>
                        <span className="w-8 text-center text-[12px]">{item.qty}</span>
                        <button aria-label="增加" disabled={item.qty >= item.stock}
                                onClick={() => changeQty(item, item.qty + 1)}
                                className="w-9 text-[16px] disabled:text-[#c4bdb4]">+</button>
                    </div>
                ) : (
                    <div className="mt-4 text-[11px] tracking-[.1em] text-[#9a3b2d]">已下架，請移除後再結帳</div>
                )}

                {/* 庫存不夠時提醒（例如加入後別人買走了） */}
                {item.onSale && item.qty > item.stock && (
                    <div className="mt-2 text-[11px] tracking-[.06em] text-[#9a3b2d]">庫存只剩 {item.stock} 件</div>
                )}

                {/* 移除 */}
                <button onClick={() => remove(item)}
                        className="mt-auto self-end pt-3 text-[11px] tracking-[.08em] text-[#76716c] underline underline-offset-4 hover:text-black">
                    移除
                </button>
            </div>
        </div>
    )
}

export default CartItem;
