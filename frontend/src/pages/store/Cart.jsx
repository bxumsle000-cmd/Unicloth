import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiArrowLongRight } from "react-icons/hi2";
import { api, toast, money, fmtDate, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../../js/kinu.js";
import CartItem from "../../component/CartItem.jsx";

function Cart() {
    const [cartItemList, setCartItemList] = useState(null);
    useEffect(() => {
        api(`/api/cart`)
            .then(setCartItemList)
            .catch((e) => toast(e.message, true));
    }, []);

    // 商品小計：只算上架中的商品（下架的結帳時會被擋下）
    const subtotal = (cartItemList || [])
        .filter((item) => item.onSale)
        .reduce((sum, item) => sum + item.price * item.qty, 0);

    // 這次小計可選的折價券；小計一變就重抓，因為「能不能用、能折多少」會跟著變
    const [couponList, setCouponList] = useState([]);
    useEffect(() => {
        if (subtotal === 0) return;
        let ignore = false;   // 數量連續變動時，只採用最後一次請求的結果
        api(`/api/coupon/usable?subtotal=${subtotal}`)
            .then((data) => { if (!ignore) setCouponList(data); })
            .catch(() => {});
        return () => { ignore = true; };
    }, [subtotal]);

    // 選了哪張券（存 id，null 是不使用）
    const [couponId, setCouponId] = useState(null);
    // 改數量後小計不夠了，就當作沒選（不用另外清掉 couponId，小計夠了會自動恢復）
    const coupon = couponList.find((c) => c.id === couponId && c.meetsMinSubtotal);
    const discount = coupon ? coupon.discount : 0;

    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal - discount + shippingFee;

    // 前往結帳：把選的折價券（整張，沒選是 null）帶到結帳頁
    const navigate = useNavigate();
    function goCheckout() {
        navigate("/checkout", { state: { coupon: coupon ?? null } });
    }

    // 改數量：後端成功才改畫面
    async function changeQty(item, qty) {
        try {
            await api(`/api/cart`, { method: "PATCH", body: { cartItemId: item.id, qty: qty } });
            setCartItemList(cartItemList.map((c) => (c.id === item.id ? { ...c, qty: qty } : c)));
        } catch (e) {
            toast(e.message, true);
        }
    }

    async function remove(item) {
        try {
            await api(`/api/cart/${item.id}`, { method: "DELETE" });
            setCartItemList(cartItemList.filter((c) => c.id !== item.id));
            toast("已移除");
        } catch (e) {
            toast(e.message, true);
        }
    }

    if (!cartItemList) return <div className="py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">載入中…</div>;

    // 共幾件：數量加總，例如 2 + 1 + 1 = 4
    const totalQty = cartItemList.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
            {/* 標題區 */}
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">SHOPPING BAG</div>
            <h1 className="mb-3 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">購物車</h1>
            <div className="mb-8 text-[11px] tracking-[.06em] text-[#76716c]">共 {totalQty} 件</div>

            {cartItemList.length === 0 ? (
                /* 購物車是空的 */
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 border-t border-[#e5e0d8] text-center">
                    <p className="text-[15px] tracking-[.06em] text-[#76716c]">購物車目前是空的</p>
                    <Link to="/"
                          className="border border-black px-8 py-3 text-[12px] tracking-[.18em]
                                     transition-colors hover:bg-black hover:text-white">
                        去逛逛
                    </Link>
                </div>) :
                (
                <div className="grid grid-cols-[1fr_340px] items-start gap-[6%]
                                max-[1000px]:grid-cols-1 max-[1000px]:gap-10">
                    {/* 左：商品清單 */}
                    <div className="border-t border-[#e5e0d8]">
                        {cartItemList.map((item) => (
                            <CartItem key={item.id} item={item} changeQty={changeQty} remove={remove} />
                        ))}
                    </div>

                    {/* 右：訂單摘要 */}
                    <aside className="border border-[#e5e0d8] bg-white p-7">
                        <div className="mb-6 text-[12px] font-medium tracking-[.14em]">訂單摘要</div>

                        <div className="space-y-4 text-[12px] tracking-[.06em]">
                            <div className="flex justify-between">
                                <span>商品小計</span><span>{money(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>運費</span><span>{shippingFee === 0 ? "免運" : money(shippingFee)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-[#9a3b2d]">
                                    <span>折價券</span><span>-{money(discount)}</span>
                                </div>
                            )}
                        </div>

                        {/* 免運進度 */}
                        <div className="mt-4 text-[10px] tracking-[.06em] text-[#76716c]">
                            {shippingFee === 0
                                ? "已達免運門檻"
                                : `再買 ${money(FREE_SHIPPING_THRESHOLD - subtotal)} 即可免運`}
                        </div>
                        {/* 免運進度條 */}
                        <div className="mt-2 h-[2px] bg-[#e5e0d8]">
                            <div className="h-full bg-black transition-[width]"
                                 style={{ width: `${Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1) * 100}%` }} />
                        </div>

                        {/* 折價券 */}
                        <div className="mt-6 border-t border-[#e5e0d8] pt-6">
                            <div className="mb-4 flex items-baseline justify-between">
                                <span className="text-[12px] tracking-[.1em]">折價券</span>
                                <Link to="/coupons" className="text-[10px] tracking-[.06em] text-[#76716c] underline underline-offset-4 hover:text-black">
                                    我的折價券
                                </Link>
                            </div>

                            <div className="space-y-4">
                                <label className="flex cursor-pointer items-center gap-3 text-[12px] tracking-[.06em]">
                                    <input type="radio" name="coupon" checked={!coupon}
                                           onChange={() => setCouponId(null)} className="accent-black" />
                                    不使用折價券
                                </label>

                                {/* 沒達到最低消費的券也列出來，但不能選 */}
                                {couponList.map((c) => (
                                    <label key={c.id}
                                           className={`flex items-start gap-3 text-[12px] tracking-[.06em]
                                                       ${c.meetsMinSubtotal ? "cursor-pointer" : "cursor-not-allowed text-[#b5ada3]"}`}>
                                        <input type="radio" name="coupon" disabled={!c.meetsMinSubtotal}
                                               checked={coupon?.id === c.id}
                                               onChange={() => setCouponId(c.id)} className="mt-[3px] accent-black" />
                                        <div className="flex-1">
                                            <div className="flex justify-between gap-3">
                                                <span>{c.title}</span>
                                                {c.meetsMinSubtotal && <span>-{money(c.discount)}</span>}
                                            </div>
                                            <div className="mt-1 text-[10px] text-[#9a948d]">
                                                {c.meetsMinSubtotal
                                                    ? `滿 ${money(c.minSubtotal)} 可使用`
                                                    : `還差 ${money(c.minSubtotal - subtotal)} 可使用`}
                                                <span className="mx-2">·</span>{fmtDate(c.expireAt)} 到期
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 合計 */}
                        <div className="mt-6 flex items-baseline justify-between border-t border-[#e5e0d8] pt-6">
                            <span className="text-[14px] tracking-[.1em]">合計</span>
                            <span className="text-[17px] tracking-[.05em]">{money(total)}</span>
                        </div>

                        {/* 前往結帳 */}
                        <button onClick={goCheckout} disabled={subtotal === 0}
                                className="mt-7 flex h-12 w-full items-center justify-center gap-2 bg-black text-[12px] tracking-[.18em] text-white
                                           transition-opacity hover:opacity-85 disabled:opacity-30">
                            前往結帳 <HiArrowLongRight className="size-4" />
                        </button>
                    </aside>
                </div>
            )}
        </div>
    )
}

export default Cart;
