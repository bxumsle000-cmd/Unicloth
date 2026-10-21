import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_TOKEN_KEY, adminApi, fmtDateTime } from "../../js/admin.js";
import { toast } from "../../js/kinu.js";
import Pagination from "../../component/product/Pagination.jsx";
import AdminHeader from "../../component/admin/AdminHeader.jsx";
import OrderDetailModal from "../../component/admin/OrderDetailModal.jsx";

const filterClass = "border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black";

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

function statusClass(status) {
    if (status === "CANCELLED") {
        return "border-[#d8b8b1] bg-[#fff5f3] text-[#9a3f30]";
    }

    if (status === "UNPAID") {
        return "border-[#ead9a4] bg-[#fffdf3] text-[#856400]";
    }

    if (status === "SHIPPED" || status === "DELIVERED") {
        return "border-[#bad4c7] bg-[#f3faf6] text-[#32654b]";
    }

    return "border-line bg-paper text-[#4d4945]";
}

function money(value) {
    return new Intl.NumberFormat("zh-TW").format(value ?? 0);
}

// 訂單物流首頁（/admin/order）：訂單查詢與物流處理
function OrderHome() {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [shippingMethod, setShippingMethod] = useState("");
    const [page, setPage] = useState(0);
    const [orderPage, setOrderPage] = useState(null);

    // null 代表沒有開啟任何訂單詳細視窗。
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
            navigate("/admin/login");
        }
    }, [navigate]);

    useEffect(() => {
        const params = new URLSearchParams({
            page: String(page),
            size: "20",
        });

        if (keyword) params.set("keyword", keyword);
        if (status) params.set("status", status);
        if (shippingMethod) params.set("shippingMethod", shippingMethod);

        adminApi(`/api/admin/order/orders?${params}`)
            .then(setOrderPage)
            .catch((error) => toast(error.message, true));
    }, [keyword, status, shippingMethod, page]);

    function search() {
        setKeyword(searchText.trim());
        setPage(0);
    }

    /**
     * 詳細視窗更新訂單後，只替換清單中對應的那筆資料。
     * 出貨與送達都使用這個函式，因此不必重新查整頁訂單。
     */
    function handleOrderUpdated(updatedOrder) {
        setOrderPage(currentPage => {
            if (!currentPage) return currentPage;

            return {
                ...currentPage,
                content: currentPage.content.map(order =>
                    order.id === updatedOrder.id
                        ? { ...order, ...updatedOrder }
                        : order
                ),
            };
        });
    }

    const orders = orderPage?.content ?? [];

    return (
        <div className="flex min-h-screen bg-paper font-kinu text-[#111] max-[760px]:flex-col">
            <aside className="w-[220px] shrink-0 border-r border-line bg-white max-[760px]:w-full max-[760px]:border-r-0 max-[760px]:border-b">
                <div className="mt-1 px-6 py-6 text-[16px] font-medium tracking-[.08em] max-[760px]:py-4">
                    訂單物流
                </div>
                <nav className="flex flex-col pb-6 max-[760px]:flex-row max-[760px]:pb-0">
                    <div className="border-l-2 border-black bg-paper px-6 py-3 text-[13px] font-medium tracking-[.08em] max-[760px]:border-l-0 max-[760px]:border-b-2 max-[760px]:px-4">
                        訂單清單
                    </div>
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <AdminHeader />

                <main className="flex-1 px-8 py-8 max-[760px]:px-4">
                    <div className="mb-6">
                        <div className="text-[10px] tracking-[.22em] text-muted">ORDER & SHIPPING</div>
                        <h1 className="text-[24px] font-medium tracking-[.08em]">訂單清單</h1>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-3">
                        <input
                            type="text"
                            value={searchText}
                            placeholder="訂單編號、會員 Email、收件人"
                            onChange={(event) => setSearchText(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") search();
                            }}
                            className={`${filterClass} w-[260px] max-[760px]:w-full`}
                        />
                        <button
                            type="button"
                            onClick={search}
                            className="border border-black bg-black px-4 py-2 text-[12px] tracking-[.1em] text-white hover:opacity-80"
                        >
                            搜尋
                        </button>

                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(0);
                            }}
                            className={filterClass}
                        >
                            <option value="">全部狀態</option>
                            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>

                        <select
                            value={shippingMethod}
                            onChange={(event) => {
                                setShippingMethod(event.target.value);
                                setPage(0);
                            }}
                            className={filterClass}
                        >
                            <option value="">全部配送方式</option>
                            {Object.entries(SHIPPING_METHOD_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3 text-[12px] tracking-[.06em] text-muted">
                        {orderPage ? `共 ${orderPage.page?.totalElements ?? 0} 筆訂單` : "載入中…"}
                    </div>

                    <div className="overflow-x-auto border border-line bg-white max-[760px]:hidden">
                        <table className="w-full min-w-[1000px] border-collapse text-left">
                            <thead className="border-b border-line bg-paper text-[11px] tracking-[.08em] text-muted">
                            <tr>
                                <th className="px-4 py-3 font-medium">訂單編號／時間</th>
                                <th className="px-4 py-3 font-medium">會員</th>
                                <th className="px-4 py-3 font-medium">收件人</th>
                                <th className="px-4 py-3 font-medium">配送</th>
                                <th className="px-4 py-3 font-medium">付款</th>
                                <th className="px-4 py-3 text-right font-medium">金額</th>
                                <th className="px-4 py-3 text-center font-medium">狀態</th>
                                <th className="px-4 py-3 text-center font-medium">詳細</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b border-line last:border-b-0 hover:bg-[#fcfbf8]">
                                    <td className="px-4 py-4">
                                        <div className="text-[13px] tracking-[.05em]">{order.orderNo}</div>
                                        <div className="mt-1 text-[11px] text-muted">{fmtDateTime(order.createdAt)}</div>
                                    </td>
                                    <td className="px-4 py-4 text-[12px]">{order.memberEmail}</td>
                                    <td className="px-4 py-4">
                                        <div className="text-[12px]">{order.receiverName}</div>
                                        <div className="mt-1 text-[11px] text-muted">{order.receiverPhone}</div>
                                    </td>
                                    <td className="px-4 py-4 text-[12px]">
                                        {SHIPPING_METHOD_LABELS[order.shippingMethod] ?? order.shippingMethod}
                                    </td>
                                    <td className="px-4 py-4 text-[12px]">
                                        {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                                    </td>
                                    <td className="px-4 py-4 text-right text-[13px]">$ {money(order.total)}</td>
                                    <td className="px-4 py-4 text-center">
                                            <span className={`inline-block border px-2.5 py-1 text-[11px] tracking-[.06em] ${statusClass(order.status)}`}>
                                                {ORDER_STATUS_LABELS[order.status] ?? order.status}
                                            </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOrderId(order.id)}
                                            className="border border-line bg-white px-3 py-1.5 text-[11px] tracking-[.06em] hover:border-black"
                                        >
                                            查看
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="hidden flex-col gap-3 max-[760px]:flex">
                        {orders.map((order) => (
                            <article key={order.id} className="border border-line bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[13px] tracking-[.05em]">{order.orderNo}</div>
                                        <div className="mt-1 text-[11px] text-muted">{fmtDateTime(order.createdAt)}</div>
                                    </div>
                                    <span className={`shrink-0 border px-2.5 py-1 text-[11px] tracking-[.06em] ${statusClass(order.status)}`}>
                                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[12px]">
                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">會員</div>
                                        <div className="mt-1 break-all">{order.memberEmail}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">收件人</div>
                                        <div className="mt-1">{order.receiverName} · {order.receiverPhone}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">配送方式</div>
                                        <div className="mt-1">
                                            {SHIPPING_METHOD_LABELS[order.shippingMethod] ?? order.shippingMethod}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">實付金額</div>
                                        <div className="mt-1">$ {money(order.total)}</div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedOrderId(order.id)}
                                    className="mt-4 w-full border border-line bg-white px-3 py-2.5 text-[12px] tracking-[.08em] hover:border-black"
                                >
                                    查看訂單詳細資料
                                </button>
                            </article>
                        ))}
                    </div>

                    {!orderPage && (
                        <p className="py-10 text-center text-[13px] text-muted">載入中…</p>
                    )}

                    {orderPage && orders.length === 0 && (
                        <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                            沒有符合條件的訂單
                        </p>
                    )}

                    <Pagination
                        page={page}
                        totalPages={orderPage?.page?.totalPages}
                        setPage={setPage}
                    />
                </main>
            </div>

            {selectedOrderId && (
                <OrderDetailModal
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                    onOrderUpdated={handleOrderUpdated}
                />
            )}
        </div>
    );
}

export default OrderHome;