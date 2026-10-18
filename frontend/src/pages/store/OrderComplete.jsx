import { Link, Navigate, useLocation } from "react-router-dom";
import { money, fmtDate } from "../../js/kinu.js";

/** 一列：左邊項目名，右邊內容 */
function Row({ label, children }) {
    return (
        <div className="flex justify-between gap-6 py-2.5 text-[12px] tracking-[.06em]">
            <span className="shrink-0 text-[#76716c]">{label}</span>
            <span className="text-right">{children}</span>
        </div>
    )
}

function OrderComplete() {
    // 結帳成功後由確認訂單頁帶過來的訂單摘要（CheckoutResponse）
    const location = useLocation();
    const order = location.state?.order;

    // 沒有訂單資料（直接輸入網址）就回首頁
    if (!order) return <Navigate to="/" replace />;

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
            <div className="mx-auto max-w-[560px]">
                <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">ORDER COMPLETE</div>
                <h1 className="mb-3 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">訂單已成立</h1>
                <p className="mb-8 text-[13px] tracking-[.06em] text-[#76716c]">感謝您的訂購，我們會盡快為您處理。</p>

                <div className="border border-[#e5e0d8] bg-white p-8 max-[760px]:p-5">
                    <div className="mb-6 border-b border-[#e5e0d8] pb-5">
                        <div className="text-[11px] tracking-[.08em] text-[#76716c]">訂單編號</div>
                        <div className="mt-1 text-[19px] tracking-[.08em]">{order.orderNo}</div>
                    </div>

                    <Row label="下單時間">{fmtDate(order.createdAt)} {String(order.createdAt).slice(11, 16)}</Row>
                    <Row label="收件人">{order.receiverName}</Row>
                    <Row label="手機">{order.receiverPhone}</Row>
                    <Row label="配送方式">{order.shippingMethod === "HOME" ? "宅配" : "超商取貨"}</Row>
                    <Row label={order.shippingMethod === "HOME" ? "宅配地址" : "超商門市"}>{order.shippingAddress}</Row>
                    <Row label="付款方式">{order.paymentMethod === "CREDIT" ? "信用卡" : order.paymentMethod === "ATM" ? "ATM 轉帳" : "貨到付款"}</Row>

                    <div className="mt-5 flex items-baseline justify-between border-t border-[#e5e0d8] pt-5">
                        <span className="text-[14px] tracking-[.1em]">實付金額</span>
                        <span className="text-[19px] tracking-[.05em]">{money(order.total)}</span>
                    </div>

                    <Link to="/"
                          className="mt-7 flex h-12 w-full items-center justify-center border border-black
                                     text-[12px] tracking-[.18em] transition-colors hover:bg-black hover:text-white">
                        繼續購物
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default OrderComplete;
