import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CiHeart } from "react-icons/ci";
import { IoHeart } from "react-icons/io5";
import { HiArrowLongRight } from "react-icons/hi2";
import { api, getToken, toast, money, imgSrc, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../../js/kinu.js";
import Accordion from "../../component/store/product/Accordion.jsx";

function ProductDetail() {
    const slug = useParams().slug;
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [notFound, setNotFound] = useState(false);
    useEffect(() => {
        api(`/api/products/${slug}`)
            .then(setProduct)
            .catch(() => setNotFound(true));
    }, [slug]);

    // 愛心要不要亮
    const [liked, setLiked] = useState(false);
    useEffect(() => {
        api(`/api/wishlist/${slug}`)
            .then(setLiked)
            .catch(() => {});   // 沒登入就當作沒收藏
    }, [slug]);

    // 選了第幾個顏色、哪個尺寸（存尺寸文字，換顏色時同尺寸可以沿用）、數量
    const [colorIndex, setColorIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [qty, setQty] = useState(1);

    // 換商品時把選項清空，避免帶著上一件商品的選擇
    const [selectedSlug, setSelectedSlug] = useState(slug);
    if (selectedSlug !== slug) {
        setSelectedSlug(slug);
        setProduct(null);
        setNotFound(false);
        setColorIndex(0);
        setSelectedSize(null);
        setQty(1);
    }

    if (notFound) return <div className="py-24 text-center text-[13px] tracking-[.06em] text-[#76716c]">找不到這件商品</div>;
    if (!product) return <div className="py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">載入中…</div>;

    const color = product.colorOptions[colorIndex];
    // 目前顏色底下、使用者選的那個尺寸（SKU）；沒選或這個顏色沒有該尺寸就是 undefined
    const sizeOption = color?.sizeOptions.find((s) => s.size === selectedSize);
    const maxQty = sizeOption ? sizeOption.stock : 1;

    // 有原價而且比售價高，就顯示成特價
    const onSaleNow = product.origPrice && product.origPrice > product.price;

    function changeColor(index) {
        setColorIndex(index);
        // 新顏色的這個尺寸缺貨或不存在，就取消選擇
        const same = product.colorOptions[index].sizeOptions.find((s) => s.size === selectedSize);
        if (!same || same.stock === 0) setSelectedSize(null);
        setQty(1);
    }

    function changeSize(size) {
        setSelectedSize(size);
        setQty(1);
    }

    async function addToCart() {
        // 沒登入就不打 API（後端會回 401），提示後帶去登入頁
        if (!getToken()) {
            toast('請先登入會員', true);
            navigate('/login');
            return;
        }
        if (!sizeOption) {
            toast('請先選擇尺寸', true);
            return;
        }
        try {
            await api('/api/cart', { method: 'POST', body: { variantId: sizeOption.variantId, qty: qty } });
            toast('已加入購物車');
        } catch (e) {
            toast(e.message, true);
        }
    }

    // 按愛心：已收藏就取消，沒收藏就加入；後端成功才換愛心
    async function toggleLike() {
        try {
            await api(`/api/wishlist/${slug}`, { method: liked ? 'DELETE' : 'POST' });
            setLiked(!liked);
            toast(liked ? '已取消收藏' : '已加入收藏');
        } catch (e) {
            toast(e.message, true);
        }
    }

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">

            <div className="grid grid-cols-[0.7fr_1fr] gap-[6%] max-[900px]:grid-cols-1 max-[900px]:gap-8">
                {/* 左：商品大圖（跟著選的顏色換） */}
                <div className="relative aspect-[3/4] self-start bg-[#F0EBE3]">
                    {color?.imageUrl && (
                        <img src={imgSrc(color.imageUrl)} alt={`${product.name} ${color.color}`}
                             className="size-full object-cover mix-blend-multiply" />
                    )}

                    {/* 收藏愛心：已收藏是紅色實心，沒收藏是空心 */}
                    <button aria-label={liked ? "取消收藏" : "收藏"} onClick={toggleLike}
                            className="absolute top-4 right-4 grid size-[42px] place-items-center rounded-full bg-[#ffffffcc]">
                        {liked
                            ? <IoHeart className="size-[22px] text-[#9a3b2d]" />
                            : <CiHeart className="size-[24px]" />}
                    </button>
                </div>

                {/* 右：商品資訊 */}
                <div className="pt-2">
                    <div className="mb-3 text-[10px] tracking-[.22em] text-[#76716c]">KINU</div>
                    <h1 className="mb-4 text-[clamp(24px,2.6vw,32px)] font-medium leading-[1.4] tracking-[.06em]">
                        {product.name}
                    </h1>

                    {/* 商品風格標籤 */}
                    {product.styles?.length > 0 && (
                        <div className="mb-5 flex flex-wrap gap-2">
                            {product.styles.map(style => (
                                <span
                                    key={style.id}
                                    className="border border-[#d6d0c7] bg-white px-3 py-1.5 text-[10px] tracking-[.1em] text-[#4a4643]"
                                >
                {style.name}
            </span>
                            ))}
                        </div>
                    )}

                    {/* 價格：特價時售價變紅，原價加刪除線 */}
                    <div
                        className={
                            "mb-9 text-[17px] tracking-[.05em] " +
                            (onSaleNow
                                ? "text-[#9a3b2d]"
                                : "")
                        }
                    >
                        {money(product.price)}

                        {onSaleNow && (
                            <del className="ml-3 text-[13px] text-[#76716c]">
                                {money(product.origPrice)}
                            </del>
                        )}
                    </div>

                    {/* 顏色 */}
                    <div className="border-b border-[#e5e0d8] pb-7">
                        <div className="mb-3 flex items-baseline justify-between">
                            <span className="text-[15px] tracking-[.1em]">{color?.color}</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {product.colorOptions.map((c, i) => (
                                <button key={c.color} title={c.color} aria-label={c.color}
                                        onClick={() => changeColor(i)}
                                        className={`aspect-[3/4] w-[58px] overflow-hidden bg-[#F0EBE3] p-0.5 transition-colors
                                                    ${i === colorIndex ? "border border-black" : "border border-transparent hover:border-[#b5ada3]"}`}>
                                    <img src={imgSrc(c.imageUrl)} alt={c.color}
                                         className="size-full object-cover mix-blend-multiply" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 尺寸：缺貨的反灰、不能按 */}
                    <div className="pt-7">
                        <div className="mb-3 text-[11px] tracking-[.1em] text-[#4a4643]">尺寸</div>
                        <div className="flex flex-wrap gap-2">
                            {color?.sizeOptions.map((s) => {
                                const soldOut = s.stock === 0;
                                const active = s.size === selectedSize;
                                return (
                                    <button key={s.variantId} disabled={soldOut}
                                            onClick={() => changeSize(s.size)}
                                            className={`h-[38px] min-w-[54px] border px-3 text-[11px] tracking-[.06em] transition-colors
                                                        ${active ? "border-black bg-black text-white" : "border-[#d6d0c7] hover:border-black"}
                                                        ${soldOut ? "cursor-not-allowed text-[#c4bdb4] line-through hover:border-[#d6d0c7]" : ""}`}>
                                        {s.size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 數量：沒選尺寸前不能調；上限是這個尺寸的庫存 */}
                    <div className="pt-9">
                        <div className="mb-3 text-[11px] tracking-[.1em] text-[#4a4643]">數量</div>
                        <div className="inline-flex h-[38px] items-center border border-[#d6d0c7]">
                            <button aria-label="減少" disabled={qty <= 1}
                                    onClick={() => setQty(qty - 1)}
                                    className="w-9 text-[16px] disabled:text-[#c4bdb4]">−</button>
                            <span className="w-8 text-center text-[12px]">{qty}</span>
                            <button aria-label="增加" disabled={!sizeOption || qty >= maxQty}
                                    onClick={() => setQty(qty + 1)}
                                    className="w-9 text-[16px] disabled:text-[#c4bdb4]">+</button>
                        </div>
                    </div>

                    {/* 加入購物車 */}
                    <button onClick={addToCart}
                            className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-black text-[12px] tracking-[.18em] text-white
                                       transition-opacity hover:opacity-85">
                        加入購物車 <HiArrowLongRight className="size-4" />
                    </button>

                    {/* 說明區：都可以摺疊 */}
                    <div className="mt-7 border-t border-[#e5e0d8]">
                        <Accordion title="商品說明" defaultOpen>
                            <p className="whitespace-pre-line">{product.description || "暫無商品說明"}</p>
                        </Accordion>

                        <Accordion title="退換貨說明">
                            <ul className="list-disc space-y-1 pl-5">
                                <li>商品到貨後 7 天內可申請退換貨（鑑賞期非試用期）。</li>
                                <li>退換商品需保持全新、吊牌完整，並附上原包裝與發票。</li>
                                <li>貼身衣物（內衣褲、襪子）及特價出清商品，基於衛生考量恕不接受退換。</li>
                                <li>如需退換貨，請至「會員中心 &gt; 客服中心」提出申請，類別選擇「退換貨」。</li>
                            </ul>
                        </Accordion>

                        <Accordion title="運費說明">
                            <ul className="list-disc space-y-1 pl-5">
                                <li>單筆訂單商品金額滿 {money(FREE_SHIPPING_THRESHOLD)} 即享免運。</li>
                                <li>未滿 {money(FREE_SHIPPING_THRESHOLD)} 酌收運費 {money(SHIPPING_FEE)}。</li>
                                <li>宅配與超商取貨運費相同。</li>
                            </ul>
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetail;
