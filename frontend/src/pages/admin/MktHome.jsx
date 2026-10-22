import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_TOKEN_KEY, adminApi, fmtDateTime } from "../../js/admin.js";
import { toast } from "../../js/kinu.js";
import Pagination from "../../component/product/Pagination.jsx";
import AdminHeader from "../../component/admin/AdminHeader.jsx";
import CouponCreateModal from "../../component/admin/CouponCreateModal.jsx";
import CouponGrantModal from "../../component/admin/CouponGrantModal.jsx";
import CouponGrantHistoryModal from "../../component/admin/CouponGrantHistoryModal.jsx";

const filterClass = "border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black";

const COUPON_TYPE_LABELS = {
    AMOUNT: "金額折抵",
    PERCENT: "百分比折扣",
};

function couponStatusClass(active) {
    return active
        ? "border-[#bad4c7] bg-[#f3faf6] text-[#32654b]"
        : "border-[#ddd] bg-[#f7f7f7] text-[#666]";
}

function discountText(coupon) {
    return coupon.type === "AMOUNT"
        ? `折抵 NT$ ${coupon.value.toLocaleString()}`
        : `折扣 ${coupon.value}%`;
}

/**
 * 行銷首頁（/admin/mkt）。
 *
 * 管理 Coupon 折價券規則；
 * MemberCoupon 則是會員實際領到的單張折價券。
 */
function MktHome() {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");
    const [keyword, setKeyword] = useState("");
    const [active, setActive] = useState("");
    const [page, setPage] = useState(0);
    const [couponPage, setCouponPage] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    // null 代表目前沒有開啟任何行銷視窗。
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [grantCoupon, setGrantCoupon] = useState(null);
    const [historyCoupon, setHistoryCoupon] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
            navigate("/admin/login");
        }
    }, [navigate]);

    /**
     * 條件、頁碼或新增成功後重新讀取折價券清單。
     */
    useEffect(() => {
        const params = new URLSearchParams({
            page: String(page),
            size: "20",
        });

        if (keyword) params.set("keyword", keyword);
        if (active !== "") params.set("active", active);

        adminApi(`/api/admin/mkt/coupons?${params}`)
            .then(setCouponPage)
            .catch(error => toast(error.message, true));
    }, [keyword, active, page, reloadKey]);

    function search() {
        setKeyword(searchText.trim());
        setPage(0);
    }

    /**
     * 啟用或停止後續發放。
     *
     * 已發給會員的券不會被刪除，
     * 所以停止後依然能透過發放紀錄追查舊資料。
     */
    async function toggleCouponActive(coupon) {
        try {
            const updatedCoupon = await adminApi(`/api/admin/mkt/coupons/${coupon.id}/active`, {
                method: "PATCH",
                body: {
                    active: !coupon.active,
                },
            });

            setCouponPage(currentPage => {
                if (!currentPage) return currentPage;

                return {
                    ...currentPage,
                    content: currentPage.content.map(item =>
                        item.id === updatedCoupon.id
                            ? updatedCoupon
                            : item
                    ),
                };
            });

            toast(updatedCoupon.active
                ? `已重新啟用 ${updatedCoupon.code}`
                : `已停止發放 ${updatedCoupon.code}`);
        } catch (error) {
            toast(error.message, true);
        }
    }

    const coupons = couponPage?.content ?? [];

    return (
        <div className="flex min-h-screen bg-paper font-kinu text-[#111] max-[760px]:flex-col">
            <aside className="w-[220px] shrink-0 border-r border-line bg-white max-[760px]:w-full max-[760px]:border-r-0 max-[760px]:border-b">
                <div className="mt-1 px-6 py-6 text-[16px] font-medium tracking-[.08em] max-[760px]:py-4">
                    行銷
                </div>

                <nav className="flex flex-col pb-6 max-[760px]:flex-row max-[760px]:pb-0">
                    <div className="border-l-2 border-black bg-paper px-6 py-3 text-[13px] font-medium tracking-[.08em] max-[760px]:border-l-0 max-[760px]:border-b-2 max-[760px]:px-4">
                        折價券管理
                    </div>
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <AdminHeader />

                <main className="flex-1 px-8 py-8 max-[760px]:px-4">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="text-[10px] tracking-[.22em] text-muted">MARKETING</div>
                            <h1 className="text-[24px] font-medium tracking-[.08em]">折價券管理</h1>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.1em] text-white hover:opacity-80"
                        >
                            新增折價券
                        </button>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-3">
                        <input
                            type="text"
                            value={searchText}
                            placeholder="搜尋折扣碼或折價券名稱"
                            onChange={event => setSearchText(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === "Enter") search();
                            }}
                            className={`${filterClass} w-[280px] max-[760px]:w-full`}
                        />

                        <button
                            type="button"
                            onClick={search}
                            className="border border-black bg-black px-4 py-2 text-[12px] tracking-[.1em] text-white hover:opacity-80"
                        >
                            搜尋
                        </button>

                        <select
                            value={active}
                            onChange={event => {
                                setActive(event.target.value);
                                setPage(0);
                            }}
                            className={filterClass}
                        >
                            <option value="">全部狀態</option>
                            <option value="true">發放中</option>
                            <option value="false">已停止發放</option>
                        </select>
                    </div>

                    <div className="mb-3 text-[12px] tracking-[.06em] text-muted">
                        {couponPage ? `共 ${couponPage.page?.totalElements ?? 0} 張折價券範本` : "載入中…"}
                    </div>

                    {/* 桌面版保留完整欄位；手機版在下方改用資訊卡。 */}
                    <div className="overflow-x-auto border border-line bg-white max-[760px]:hidden">
                        <table className="w-full min-w-[1160px] border-collapse text-left">
                            <thead className="border-b border-line bg-paper text-[11px] tracking-[.08em] text-muted">
                            <tr>
                                <th className="px-4 py-3 font-medium">折扣碼／名稱</th>
                                <th className="px-4 py-3 font-medium">優惠內容</th>
                                <th className="px-4 py-3 font-medium">使用條件</th>
                                <th className="px-4 py-3 text-center font-medium">註冊贈禮</th>
                                <th className="px-4 py-3 text-center font-medium">狀態</th>
                                <th className="px-4 py-3 font-medium">建立時間</th>
                                <th className="px-4 py-3 text-center font-medium">操作</th>
                            </tr>
                            </thead>

                            <tbody>
                            {coupons.map(coupon => (
                                <tr key={coupon.id} className="border-b border-line last:border-b-0 hover:bg-[#fcfbf8]">
                                    <td className="px-4 py-4">
                                        <div className="text-[13px] font-medium tracking-[.06em]">{coupon.code}</div>
                                        <div className="mt-1 text-[12px] text-muted">{coupon.title}</div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="text-[12px]">{discountText(coupon)}</div>
                                        <div className="mt-1 text-[11px] text-muted">
                                            {COUPON_TYPE_LABELS[coupon.type] ?? coupon.type}
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-[12px]">
                                        <div>滿 NT$ {coupon.minSubtotal.toLocaleString()} 可用</div>
                                        <div className="mt-1 text-[11px] text-muted">
                                            領取後 {coupon.validDays} 天有效
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-center text-[12px]">
                                        {coupon.signupGift ? "是" : "否"}
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                            <span className={`inline-block border px-2.5 py-1 text-[11px] tracking-[.06em] ${couponStatusClass(coupon.active)}`}>
                                                {coupon.active ? "發放中" : "已停止"}
                                            </span>
                                    </td>

                                    <td className="px-4 py-4 text-[11px] text-muted">
                                        {fmtDateTime(coupon.createdAt)}
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setHistoryCoupon(coupon)}
                                                className="border border-line bg-white px-3 py-1.5 text-[11px] tracking-[.06em] hover:border-black"
                                            >
                                                發放紀錄
                                            </button>

                                            <button
                                                type="button"
                                                disabled={!coupon.active}
                                                onClick={() => setGrantCoupon(coupon)}
                                                className="border border-line bg-white px-3 py-1.5 text-[11px] tracking-[.06em] hover:border-black disabled:cursor-not-allowed disabled:opacity-35"
                                            >
                                                指定發券
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toggleCouponActive(coupon)}
                                                className="border border-line bg-white px-3 py-1.5 text-[11px] tracking-[.06em] hover:border-black"
                                            >
                                                {coupon.active ? "停止發放" : "重新啟用"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 手機版使用卡片，避免七欄表格縮小後難以閱讀。 */}
                    <div className="hidden flex-col gap-3 max-[760px]:flex">
                        {coupons.map(coupon => (
                            <article key={coupon.id} className="border border-line bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[14px] font-medium tracking-[.06em]">{coupon.code}</div>
                                        <div className="mt-1 text-[12px] text-muted">{coupon.title}</div>
                                    </div>

                                    <span className={`shrink-0 border px-2.5 py-1 text-[11px] tracking-[.06em] ${couponStatusClass(coupon.active)}`}>
                                        {coupon.active ? "發放中" : "已停止"}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[12px]">
                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">優惠內容</div>
                                        <div className="mt-1">{discountText(coupon)}</div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">使用條件</div>
                                        <div className="mt-1">滿 NT$ {coupon.minSubtotal.toLocaleString()}</div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">有效天數</div>
                                        <div className="mt-1">領取後 {coupon.validDays} 天</div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">註冊贈禮</div>
                                        <div className="mt-1">{coupon.signupGift ? "是" : "否"}</div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setHistoryCoupon(coupon)}
                                        className="border border-line bg-white px-2 py-2.5 text-[11px] tracking-[.06em] hover:border-black"
                                    >
                                        發放紀錄
                                    </button>

                                    <button
                                        type="button"
                                        disabled={!coupon.active}
                                        onClick={() => setGrantCoupon(coupon)}
                                        className="border border-line bg-white px-2 py-2.5 text-[11px] tracking-[.06em] hover:border-black disabled:cursor-not-allowed disabled:opacity-35"
                                    >
                                        指定發券
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => toggleCouponActive(coupon)}
                                        className="border border-line bg-white px-2 py-2.5 text-[11px] tracking-[.06em] hover:border-black"
                                    >
                                        {coupon.active ? "停止發放" : "重新啟用"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    {!couponPage && (
                        <p className="py-10 text-center text-[13px] text-muted">載入中…</p>
                    )}

                    {couponPage && coupons.length === 0 && (
                        <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                            沒有符合條件的折價券
                        </p>
                    )}

                    <Pagination
                        page={page}
                        totalPages={couponPage?.page?.totalPages}
                        setPage={setPage}
                    />
                </main>
            </div>

            {showCreateModal && (
                <CouponCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setPage(0);
                        setReloadKey(current => current + 1);
                    }}
                />
            )}

            {grantCoupon && (
                <CouponGrantModal
                    coupon={grantCoupon}
                    onClose={() => setGrantCoupon(null)}
                />
            )}

            {historyCoupon && (
                <CouponGrantHistoryModal
                    coupon={historyCoupon}
                    onClose={() => setHistoryCoupon(null)}
                />
            )}
        </div>
    );
}

export default MktHome;