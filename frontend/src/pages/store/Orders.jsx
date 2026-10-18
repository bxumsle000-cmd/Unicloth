import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, toast, money, imgSrc, fmtDate } from "../../js/kinu.js";

// 後端回的訂單狀態（OrderStatus）→ 中文
const ORDER_STATUS_LABELS = {
    UNPAID: "未付款",
    PENDING: "訂單確認中",
    SHIPPED: "已出貨",
    DELIVERED: "已送達",
    PICKED_UP: "取貨完畢",
    CANCELLED: "已取消",
};

// 篩選分頁籤：依 ORDER_STATUS_LABELS 的順序
const STATUS_TABS = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }));

/** 一列：左邊項目名，右邊內容 */
function Row({ label, children }) {
    return (
        <div className="flex justify-between gap-6 py-1.5 text-[12px] tracking-[.06em]">
            <span className="shrink-0 text-[#76716c]">{label}</span>
            <span className="text-right">{children}</span>
        </div>
    )
}

function Orders() {
    // null = 還沒載入完
    const [orderList, setOrderList] = useState(null);
    useEffect(() => {
        api(`/api/orders`)
            .then(setOrderList)
            .catch((e) => toast(e.message, true));
    }, []);

    // 目前看哪個狀態
    const [statusTab, setStatusTab] = useState("PENDING");

    if (!orderList) return <div className="py-24 text-center text-[11px] tracking-[.06em] text-[#76716c]">載入中…</div>;

    const shownOrderList = orderList.filter((order) => order.status === statusTab);

    // 某個狀態有幾筆訂單
    function countOf(status) {
        return orderList.filter((order) => order.status === status).length;
    }

    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
            {/* 標題區 */}
            <h1 className="mb-3 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">我的訂單</h1>
            <div className="mb-8 text-[11px] tracking-[.06em] text-[#76716c]">共 {orderList.length} 筆訂單</div>

            {/* 狀態篩選 */}
            <div className="mb-6 flex flex-wrap gap-2">
                {STATUS_TABS.map((tab) => (
                    <button key={tab.value} onClick={() => setStatusTab(tab.value)}
                            className={`border px-4 py-2 text-[11px] tracking-[.08em] transition-colors
                                        ${statusTab === tab.value ? "border-black bg-black text-white" : "border-[#d6d0c7] hover:border-black"}`}>
                        {tab.label} {countOf(tab.value)}
                    </button>
                ))}
            </div>

            {shownOrderList.length === 0 ? (
                /* 沒有訂單 */
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 border-t border-[#e5e0d8] text-center">
                    <p className="text-[15px] tracking-[.06em] text-[#76716c]">{`目前沒有${ORDER_STATUS_LABELS[statusTab]}訂單`}</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {shownOrderList.map((order) => (
                        <div key={order.orderNo} className="border border-[#e5e0d8] bg-white p-7 max-[760px]:p-5">
                            {/* 訂單編號、下單時間、狀態 */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e0d8] pb-4">
                                <div>
                                    <div className="text-[15px] tracking-[.08em]">{order.orderNo}</div>
                                    <div className="mt-1 text-[11px] tracking-[.06em] text-[#76716c]">
                                        {fmtDate(order.createdAt)} {String(order.createdAt).slice(11, 16)}
                                    </div>
                                </div>
                                <span className="border border-[#d6d0c7] px-3 py-1 text-[11px] tracking-[.08em]">
                                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                                </span>
                            </div>

                            {/* 商品明細（明細沒有 id，用順序當 key） */}
                            <div>
                                {order.orderItemResponseList.map((item, index) => (
                                    <div key={index} className="flex gap-5 border-b border-[#e5e0d8] py-4 max-[760px]:gap-4">
                                        <div className="aspect-[3/4] w-[72px] shrink-0 bg-[#F0EBE3] max-[760px]:w-[60px]">
                                            <img src={imgSrc(item.imageUrl)} alt={item.productName}
                                                 className="size-full object-cover mix-blend-multiply" />
                                        </div>
                                        <div className="flex flex-1 items-start justify-between gap-4">
                                            <div>
                                                <div className="text-[13px] leading-[1.6] tracking-[.04em]">{item.productName}</div>
                                                <div className="mt-1 text-[11px] tracking-[.06em] text-[#76716c]">
                                                    {item.color}<span className="mx-2">/</span>{item.size}<span className="mx-2">·</span>× {item.qty}
                                                </div>
                                            </div>
                                            <div className="text-[13px] tracking-[.05em] whitespace-nowrap">{money(item.totalPrice)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 配送、付款資訊 */}
                            <div className="pt-4">
                                <Row label="收件人">{order.receiverName}<span className="mx-2">·</span>{order.receiverPhone}</Row>
                                <Row label="配送方式">{order.shippingMethod === "HOME" ? "宅配" : "超商取貨"}</Row>
                                <Row label={order.shippingMethod === "HOME" ? "宅配地址" : "超商門市"}>{order.shippingAddress}</Row>
                                <Row label="付款方式">{order.paymentMethod === "CREDIT" ? "信用卡" : order.paymentMethod === "ATM" ? "ATM 轉帳" : "貨到付款"}</Row>
                                {order.note && <Row label="備註">{order.note}</Row>}
                            </div>

                            <div className="mt-4 flex items-baseline justify-between border-t border-[#e5e0d8] pt-4">
                                <span className="text-[13px] tracking-[.1em]">實付金額</span>
                                <span className="text-[17px] tracking-[.05em]">{money(order.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Orders;
