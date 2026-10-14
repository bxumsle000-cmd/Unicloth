import { useState, useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api, toast, money, imgSrc, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE,
         SHIPPING_OPTIONS, PAYMENT_OPTIONS } from "../js/kinu.js";

const inputClass = "w-full border-b border-[#d6d0c7] bg-transparent py-2 text-[14px] tracking-[.04em] outline-none focus:border-black";

/** 一個欄位：上面小標題，下面放輸入框 */
function Field({ label, children }) {
    return (
        <label className="block">
            <span className="text-[11px] tracking-[.08em] text-[#76716c]">{label}</span>
            {children}
        </label>
    )
}

/** 一組單選：options 是 [{ value, label }] */
function RadioGroup({ name, options, value, onChange }) {
    return (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {options.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2 text-[13px] tracking-[.06em]">
                    <input type="radio" name={name} checked={value === o.value}
                           onChange={() => onChange(o.value)} className="size-4 accent-black" />
                    {o.label}
                </label>
            ))}
        </div>
    )
}

function Checkout() {
    // 購物車頁選的折價券，用 navigate 的 state 帶過來（存在瀏覽紀錄裡，重新整理還在）
    const location = useLocation();
    const coupon = location.state?.coupon ?? null;
    const discount = coupon ? coupon.discount : 0;

    const [cartItemList, setCartItemList] = useState(null);
    useEffect(() => {
        api(`/api/cart`)
            .then(setCartItemList)
            .catch((e) => toast(e.message, true));
    }, []);

    // 會員資料：勾「同訂購人」時帶入
    const [member, setMember] = useState(null);
    useEffect(() => {
        api(`/api/member/me`).then(setMember).catch(() => {});
    }, []);

    // 只買上架中的商品（下架的結帳 API 會擋）
    const buyList = (cartItemList || []).filter((item) => item.onSale);
    const subtotal = buyList.reduce((sum, item) => sum + item.price * item.qty, 0);

    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal - discount + shippingFee;

    // 表單欄位，名稱跟結帳 API 的 request 一樣，之後送出時可以直接用
    const [form, setForm] = useState({
        receiverName: "",
        receiverPhone: "",
        receiverEmail: "",
        shippingMethod: "HOME",
        shippingAddress: "",
        paymentMethod: "CREDIT",
        note: "",
    });
    // 改其中一個欄位：複製一份舊的，再蓋掉要改的那個
    function changeField(name, value) {
        setForm({ ...form, [name]: value });
    }

    // 同訂購人：勾起來帶入會員資料，取消就清空
    const [sameAsMember, setSameAsMember] = useState(false);
    function toggleSameAsMember(checked) {
        setSameAsMember(checked);
        setForm({
            ...form,
            receiverName: checked ? member.name : "",
            receiverPhone: checked ? member.phone : "",
            receiverEmail: checked ? member.email : "",
        });
    }

    // 送出中：按鈕鎖住，避免連點送出兩張訂單
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    async function submitOrder() {
        // 必填欄位先在前端擋，後端的錯誤訊息會帶英文欄位名，不適合直接給使用者看
        if (!form.receiverName.trim()) return toast("請填寫收件人", true);
        if (!form.receiverPhone.trim()) return toast("請填寫手機", true);
        if (!form.receiverEmail.trim()) return toast("請填寫 Email", true);
        if (!form.shippingAddress.trim()) {return toast("請填寫地址", true);}

        setSubmitting(true);
        try {
            const order = await api(`/api/checkout`, {
                method: "POST",
                body: {
                    ...form,
                    note: form.note.trim() || null,
                    memberCouponId: coupon ? coupon.id : null,
                    cartItemIdList: buyList.map((item) => item.id),
                },
            });
            // 線上付款（信用卡 / ATM）交由後端產生綠界簽章表單，再自動 POST 到綠界測試站。
            // 貨到付款維持原本流程，不跳轉綠界。
            if (form.paymentMethod === "CREDIT" || form.paymentMethod === "ATM") {
                const payment = await api("/api/ecpay/create-payment", {
                    method: "POST",
                    body: { orderNo: order.orderNo },
                });
                const formElement = document.createElement("form");
                formElement.method = "POST";
                formElement.action = payment.action;
                Object.entries(payment.fields).forEach(([name, value]) => {
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = name;
                    input.value = value;
                    formElement.appendChild(input);
                });
                document.body.appendChild(formElement);
                formElement.submit();
                return;
            }
            // 貨到付款：按「上一頁」不會回到已經結完帳的確認訂單頁
            navigate("/order-complete", { state: { order }, replace: true });
        } catch (e) {
            toast(e.message, true);
            setSubmitting(false);
        }
    }

    // 一定要從購物車按「前往結帳」進來（會帶 state）；直接輸入網址就導回購物車
    // replace：取代這筆瀏覽紀錄，按「上一頁」才不會又跳回 /checkout
    if (!location.state) return <Navigate to="/cart" replace />;

    if (!cartItemList) return <div className="py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">載入中…</div>;

    if (buyList.length === 0) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
                <p className="text-[15px] tracking-[.06em] text-[#76716c]">沒有可以結帳的商品</p>
                <Link to="/cart"
                      className="border border-black px-8 py-3 text-[12px] tracking-[.18em]
                                 transition-colors hover:bg-black hover:text-white">
                    回購物車
                </Link>
            </div>
        );
    }

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
            <div className="mx-auto max-w-[560px]">
                {/* 標題區 */}
                <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">CHECKOUT</div>
                <h1 className="mb-8 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">確認訂單</h1>

                <div className="border border-[#e5e0d8] bg-white p-8 max-[760px]:p-5">
                    {/* 購買商品 */}
                    <div className="mb-4 text-[12px] font-medium tracking-[.14em]">購買商品</div>
                    <div className="border-b border-[#e5e0d8] pb-5">
                        {buyList.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 py-2.5">
                                <div className="aspect-[3/4] w-[48px] shrink-0 bg-[#F0EBE3]">
                                    <img src={imgSrc(item.imageUrl)} alt={item.name}
                                         className="size-full object-cover mix-blend-multiply" />
                                </div>
                                <div className="flex-1 text-[12px] tracking-[.04em]">
                                    <div>{item.name}</div>
                                    <div className="mt-1 text-[11px] text-[#76716c]">
                                        {item.color}<span className="mx-2">/</span>{item.size}<span className="mx-2">×</span>{item.qty}
                                    </div>
                                </div>
                                <div className="text-[12px] tracking-[.05em]">{money(item.price * item.qty)}</div>
                            </div>
                        ))}
                    </div>

                    {/* 收件資料 */}
                    <div className="mt-7 mb-5 flex items-center justify-between">
                        <span className="text-[12px] font-medium tracking-[.14em]">收件資料</span>
                        <label className={`flex items-center gap-2 text-[12px] tracking-[.06em]
                                           ${member ? "cursor-pointer" : "cursor-not-allowed text-[#b5ada3]"}`}>
                            <input type="checkbox" checked={sameAsMember} disabled={!member}
                                   onChange={(e) => toggleSameAsMember(e.target.checked)}
                                   className="size-4 accent-black" />
                            同訂購人
                        </label>
                    </div>

                    <div className="space-y-6">
                        <Field label="收件人">
                            <input className={inputClass} value={form.receiverName} maxLength={50}
                                   onChange={(e) => changeField("receiverName", e.target.value)} />
                        </Field>
                        <Field label="手機">
                            <input className={inputClass} type="tel" value={form.receiverPhone} maxLength={20}
                                   onChange={(e) => changeField("receiverPhone", e.target.value)} />
                        </Field>
                        <Field label="Email（訂單通知用）">
                            <input className={inputClass} type="email" value={form.receiverEmail} maxLength={255}
                                   onChange={(e) => changeField("receiverEmail", e.target.value)} />
                        </Field>

                        {/* 配送方式：宅配填地址，超商填門市名 */}
                        <div>
                            <span className="text-[11px] tracking-[.08em] text-[#76716c]">配送方式</span>
                            <RadioGroup name="shippingMethod" options={SHIPPING_OPTIONS} value={form.shippingMethod}
                                        onChange={(v) => changeField("shippingMethod", v)} />
                        </div>
                        <Field label={form.shippingMethod === "HOME" ? "宅配地址" : "超商門市名稱"}>
                            <input className={inputClass} value={form.shippingAddress} maxLength={255}
                                   onChange={(e) => changeField("shippingAddress", e.target.value)} />
                        </Field>

                        <div>
                            <span className="text-[11px] tracking-[.08em] text-[#76716c]">付款方式</span>
                            <RadioGroup name="paymentMethod" options={PAYMENT_OPTIONS} value={form.paymentMethod}
                                        onChange={(v) => changeField("paymentMethod", v)} />
                        </div>

                        <Field label="備註（可不填）">
                            <textarea className={`${inputClass} resize-y`} rows={2} value={form.note} maxLength={255}
                                      onChange={(e) => changeField("note", e.target.value)} />
                        </Field>
                    </div>

                    {/* 金額明細 + 合計 */}
                    <div className="mt-8 space-y-3 border-t border-[#e5e0d8] pt-6 text-[12px] tracking-[.06em]">
                        <div className="flex justify-between">
                            <span>商品小計</span><span>{money(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>運費</span><span>{shippingFee === 0 ? "免運" : money(shippingFee)}</span>
                        </div>
                        {coupon && (
                            <div className="flex justify-between text-[#9a3b2d]">
                                <span>折價券（{coupon.title}）</span><span>-{money(discount)}</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-5 flex items-baseline justify-between border-t border-[#e5e0d8] pt-5">
                        <span className="text-[14px] tracking-[.1em]">合計</span>
                        <span className="text-[19px] tracking-[.05em]">{money(total)}</span>
                    </div>

                    <button onClick={submitOrder} disabled={submitting}
                            className="mt-7 h-12 w-full bg-black text-[12px] tracking-[.18em] text-white transition-opacity
                                       hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50">
                        {submitting ? "處理中…" : "確認下單"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Checkout;
