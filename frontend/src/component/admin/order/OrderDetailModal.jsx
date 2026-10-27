import { useEffect, useState } from "react";
import { adminApi, fmtDateTime } from "../../../js/admin.js";
import { imgSrc, money } from "../../../js/kinu.js";

const ORDER_STATUS_LABELS = {
    UNPAID: "未付款",
    PENDING: "訂單確認中",
    SHIPPED: "已出貨",
    DELIVERED: "已送達",
    PICKED_UP: "取貨完畢",
    CANCELLED: "已取消",
};

const SHIPPING_METHOD_LABELS = {
    HOME: "宅配",
    CVS: "超商取貨",
};

const PAYMENT_METHOD_LABELS = {
    CREDIT: "信用卡",
    ATM: "ATM 轉帳",
    COD: "貨到付款",
};

/** 顯示一個欄位名稱與內容，訂單資料區共用。 */
function InfoItem({ label, children, className = "" }) {
    return (
        <div className={className}>
            <div className="text-[10px] tracking-[.08em] text-muted">{label}</div>
            <div className="mt-1 break-words text-[13px] leading-[1.6]">{children || "—"}</div>
        </div>
    );
}

/**
 * 訂單詳細視窗。
 *
 * 只有使用者點選清單的一筆訂單才呼叫詳細 API，
 * 避免列表載入時對每筆訂單都額外查詢商品明細。
 */
function OrderDetailModal({ orderId, onClose, onOrderUpdated }) {
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");
    const [shippingCarrier, setShippingCarrier] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shippingError, setShippingError] = useState("");
    const [cancelError, setCancelError] = useState("");
    const [deliveryError, setDeliveryError] = useState("");
    const [pickupError, setPickupError] = useState("");
    const [isShipping, setIsShipping] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isDelivering, setIsDelivering] = useState(false);
    const [isPickingUp, setIsPickingUp] = useState(false);

    useEffect(() => {
        let active = true;

        adminApi(`/api/admin/order/orders/${orderId}`)
            .then(data => {
                if (!active) return;
                setOrder(data);
                // 若訂單原本已有物流資料，表單預先帶入，方便確認或補正。
                setShippingCarrier(data.shippingCarrier ?? "");
                setTrackingNumber(data.trackingNumber ?? "");
            })
            .catch(e => {
                if (active) setError(e.message);
            });

        return () => {
            active = false;
        };
    }, [orderId]);

    /**
     * 統一更新視窗與背景清單的訂單資料。
     * 出貨、取消、送達、取貨四種操作都會回傳最新訂單。
     */
    function applyUpdatedOrder(updatedOrder) {
        setOrder(updatedOrder);
        setShippingCarrier(updatedOrder.shippingCarrier ?? "");
        setTrackingNumber(updatedOrder.trackingNumber ?? "");
        onOrderUpdated?.(updatedOrder);
    }

    /**
     * 送出物流商與追蹤碼，並由後端將訂單狀態改為 SHIPPED。
     * 成功後只更新畫面資料，不關閉視窗。
     */
    async function handleShip(event) {
        event.preventDefault();
        setShippingError("");

        if (!shippingCarrier.trim() || !trackingNumber.trim()) {
            setShippingError("請完整填寫物流商與物流追蹤碼。");
            return;
        }

        setIsShipping(true);

        try {
            const updatedOrder = await adminApi(
                `/api/admin/order/orders/${orderId}/ship`,
                {
                    method: "PATCH",
                    body: {
                        shippingCarrier: shippingCarrier.trim(),
                        trackingNumber: trackingNumber.trim(),
                    },
                }
            );
            applyUpdatedOrder(updatedOrder);
        } catch (e) {
            setShippingError(e.message);
        } finally {
            setIsShipping(false);
        }
    }

    /**
     * 取消尚未出貨的訂單。
     * 已付款的訂單會先提醒退款仍需另外處理，避免誤以為已自動退款。
     */
    async function handleCancel() {
        const confirmMessage = order?.paidAt
            ? "此訂單已付款。取消後會回補庫存與釋放優惠券，但退款仍需另外處理。確定取消嗎？"
            : "確定要取消此訂單嗎？取消後會回補庫存與釋放優惠券。";

        if (!window.confirm(confirmMessage)) return;

        setCancelError("");
        setIsCancelling(true);

        try {
            const updatedOrder = await adminApi(
                `/api/admin/order/orders/${orderId}/cancel`,
                { method: "PATCH" }
            );
            applyUpdatedOrder(updatedOrder);
        } catch (e) {
            setCancelError(e.message);
        } finally {
            setIsCancelling(false);
        }
    }

    /**
     * 確認物流已送達。
     * 送達時間由後端記錄，前端只送出這筆訂單要進入送達狀態的要求。
     */
    async function handleDeliver() {
        setDeliveryError("");
        setIsDelivering(true);

        try {
            const updatedOrder = await adminApi(
                `/api/admin/order/orders/${orderId}/deliver`,
                { method: "PATCH" }
            );
            applyUpdatedOrder(updatedOrder);
        } catch (e) {
            setDeliveryError(e.message);
        } finally {
            setIsDelivering(false);
        }
    }

    /**
     * 手動確認會員已取貨。
     * 目前尚未串接物流商，因此由後台人員按下此按鈕完成訂單。
     */
    async function handlePickup() {
        setPickupError("");
        setIsPickingUp(true);

        try {
            const updatedOrder = await adminApi(
                `/api/admin/order/orders/${orderId}/pickup`,
                { method: "PATCH" }
            );
            applyUpdatedOrder(updatedOrder);
        } catch (e) {
            setPickupError(e.message);
        } finally {
            setIsPickingUp(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="訂單詳細資料"
            onClick={onClose}
        >
            <div
                className="max-h-full w-full max-w-[960px] overflow-y-auto border border-line bg-paper"
                onClick={event => event.stopPropagation()}
            >
                <header className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-white px-6 py-4 max-[600px]:px-4">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">ORDER DETAIL</div>
                        <h2 className="mt-1 text-[20px] font-medium tracking-[.06em]">訂單詳細資料</h2>
                        {order && <p className="mt-1 text-[11px] text-muted">{order.orderNo}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="關閉"
                        title="關閉"
                        className="flex h-9 w-9 items-center justify-center border border-line text-[24px] leading-none hover:border-black"
                    >
                        ×
                    </button>
                </header>

                {!order && !error && (
                    <p className="px-6 py-12 text-center text-[13px] text-muted">
                        訂單資料載入中……
                    </p>
                )}

                {error && (
                    <div className="p-6 max-[600px]:p-4">
                        <p className="border border-[#b0413e] bg-white px-4 py-3 text-[13px] text-[#b0413e]">
                            {error}
                        </p>
                    </div>
                )}

                {order && (
                    <div className="p-6 max-[600px]:p-4">
                        {/* 訂單狀態與時間 */}
                        <section className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-[14px] font-medium tracking-[.1em]">訂單狀態</h3>
                                    <p className="mt-1 text-[11px] text-muted">
                                        建立於 {fmtDateTime(order.createdAt)}
                                    </p>
                                </div>
                                <span className="border border-line bg-paper px-3 py-1.5 text-[11px] tracking-[.08em]">
                                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 max-[600px]:grid-cols-1">
                                <InfoItem label="付款時間">{fmtDateTime(order.paidAt)}</InfoItem>
                                <InfoItem label="出貨時間">{fmtDateTime(order.shippedAt)}</InfoItem>
                                <InfoItem label="送達時間">{fmtDateTime(order.deliveredAt)}</InfoItem>
                                <InfoItem label="完成時間">{fmtDateTime(order.completedAt)}</InfoItem>
                            </div>
                        </section>

                        {/* 收件、物流資料與物流流程按鈕 */}
                        <section className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                            <h3 className="mb-4 text-[14px] font-medium tracking-[.1em]">收件與物流</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 max-[600px]:grid-cols-1">
                                <InfoItem label="會員 Email">{order.memberEmail}</InfoItem>
                                <InfoItem label="收件人">
                                    {order.receiverName}　{order.receiverPhone}
                                </InfoItem>
                                <InfoItem label="收件人 Email">{order.receiverEmail}</InfoItem>
                                <InfoItem label="配送方式">
                                    {SHIPPING_METHOD_LABELS[order.shippingMethod] ?? order.shippingMethod}
                                </InfoItem>
                                <InfoItem
                                    label={order.shippingMethod === "HOME" ? "宅配地址" : "超商門市"}
                                    className="col-span-2 max-[600px]:col-span-1"
                                >
                                    {order.shippingAddress}
                                </InfoItem>
                                <InfoItem label="物流商">{order.shippingCarrier}</InfoItem>
                                <InfoItem label="追蹤碼">{order.trackingNumber}</InfoItem>
                            </div>

                            {order.status === "PENDING" && (
                                <form onSubmit={handleShip} className="mt-5 border-t border-line pt-5">
                                    <div className="mb-4">
                                        <h4 className="text-[13px] font-medium tracking-[.08em]">確認出貨</h4>
                                        <p className="mt-1 text-[11px] text-muted">
                                            填寫後會將訂單狀態改為「已出貨」。
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
                                        <label className="block">
                                            <span className="text-[11px] text-muted">物流商</span>
                                            <input
                                                type="text"
                                                value={shippingCarrier}
                                                onChange={event => setShippingCarrier(event.target.value)}
                                                placeholder="例如：黑貓宅急便"
                                                maxLength="50"
                                                className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-[11px] text-muted">物流追蹤碼</span>
                                            <input
                                                type="text"
                                                value={trackingNumber}
                                                onChange={event => setTrackingNumber(event.target.value)}
                                                placeholder="請輸入物流提供的追蹤碼"
                                                maxLength="100"
                                                className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                                            />
                                        </label>
                                    </div>

                                    {shippingError && (
                                        <p className="mt-3 border border-[#b0413e] bg-[#fff5f3] px-3 py-2 text-[12px] text-[#9a3f30]">
                                            {shippingError}
                                        </p>
                                    )}

                                    {cancelError && (
                                        <p className="mt-3 border border-[#b0413e] bg-[#fff5f3] px-3 py-2 text-[12px] text-[#9a3f30]">
                                            {cancelError}
                                        </p>
                                    )}

                                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={isCancelling || isShipping}
                                            className="border border-[#b0413e] bg-white px-5 py-2.5 text-[12px] tracking-[.08em] text-[#9a3f30] hover:bg-[#fff5f3] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {isCancelling ? "取消處理中…" : "取消訂單"}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isShipping || isCancelling}
                                            className="border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {isShipping ? "出貨處理中…" : "確認出貨"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {order.status === "SHIPPED" && (
                                <div className="mt-5 border-t border-line pt-5">
                                    <div className="mb-4">
                                        <h4 className="text-[13px] font-medium tracking-[.08em]">確認送達</h4>
                                        <p className="mt-1 text-[11px] text-muted">
                                            確認物流已送達後，訂單狀態會改為「已送達」。
                                        </p>
                                    </div>

                                    {deliveryError && (
                                        <p className="mb-3 border border-[#b0413e] bg-[#fff5f3] px-3 py-2 text-[12px] text-[#9a3f30]">
                                            {deliveryError}
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleDeliver}
                                            disabled={isDelivering}
                                            className="border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {isDelivering ? "送達處理中…" : "確認送達"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {order.status === "DELIVERED" && (
                                <div className="mt-5 border-t border-line pt-5">
                                    <div className="mb-4">
                                        <h4 className="text-[13px] font-medium tracking-[.08em]">確認取貨</h4>
                                        <p className="mt-1 text-[11px] text-muted">
                                            目前尚未串接物流商，確認會員已取貨後，訂單會改為「取貨完畢」。
                                        </p>
                                    </div>

                                    {pickupError && (
                                        <p className="mb-3 border border-[#b0413e] bg-[#fff5f3] px-3 py-2 text-[12px] text-[#9a3f30]">
                                            {pickupError}
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handlePickup}
                                            disabled={isPickingUp}
                                            className="border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {isPickingUp ? "取貨處理中…" : "確認取貨"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* 下單時的商品快照 */}
                        <section className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                            <h3 className="mb-4 text-[14px] font-medium tracking-[.1em]">商品明細</h3>
                            <div className="grid gap-3">
                                {order.items.map((item, index) => (
                                    <article
                                        key={index}
                                        className="flex gap-4 border border-line bg-paper p-3 max-[480px]:gap-3"
                                    >
                                        {item.imageUrl ? (
                                            <img
                                                src={imgSrc(item.imageUrl)}
                                                alt={item.productName}
                                                className="h-[88px] w-[66px] shrink-0 border border-line object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-[88px] w-[66px] shrink-0 items-center justify-center border border-line bg-white text-[10px] text-muted">
                                                無圖
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="text-[13px] leading-[1.6]">{item.productName}</div>
                                            <div className="mt-1 text-[11px] text-muted">
                                                {item.color}／{item.size}　× {item.qty}
                                            </div>
                                            <div className="mt-2 text-[11px] text-muted">
                                                單價 {money(item.unitPrice)}
                                            </div>
                                        </div>

                                        <div className="shrink-0 self-end text-[13px]">
                                            {money(item.totalPrice)}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {/* 金額與備註 */}
                        <section className="border border-line bg-white p-5 max-[600px]:p-4">
                            <h3 className="mb-4 text-[14px] font-medium tracking-[.1em]">付款與金額</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 max-[600px]:grid-cols-1">
                                <InfoItem label="付款方式">
                                    {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                                </InfoItem>
                                <InfoItem label="訂單備註">{order.note}</InfoItem>
                            </div>

                            <div className="mt-5 border-t border-line pt-4 text-[13px]">
                                <div className="flex justify-between py-1">
                                    <span className="text-muted">商品小計</span>
                                    <span>{money(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-muted">折價券折抵</span>
                                    <span>- {money(order.discount)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-muted">運費</span>
                                    <span>{money(order.shippingFee)}</span>
                                </div>
                                <div className="mt-2 flex justify-between border-t border-line pt-3 text-[16px] font-medium">
                                    <span>實付金額</span>
                                    <span>{money(order.total)}</span>
                                </div>
                            </div>
                        </section>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="border border-line bg-white px-5 py-2.5 text-[12px] hover:border-black"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderDetailModal;