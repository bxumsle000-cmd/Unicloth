import { useState, useEffect } from "react";
import { api, toast } from "../js/kinu.js";
import CouponCard from "../component/CouponCard.jsx";

// 分頁籤：value 對應後端回來的 status
const TABS = [
    { value: "usable", label: "可使用" },
    { value: "used", label: "已使用" },
    { value: "expired", label: "已過期" },
];

function Coupons() {
    const [couponList, setCouponList] = useState([]);
    useEffect(() => {
        api(`/api/coupon`)
            .then(setCouponList)
            .catch((e) => toast(e.message, true));
    }, []);

    // 目前看哪個分頁
    const [tab, setTab] = useState("usable");

    const shownList = couponList.filter((c) => c.status === tab);

    // 每種狀態有幾張，例如 { usable: 2, used: 0, expired: 0 }
    function countOf(status) {
        return couponList.filter((c) => c.status === status).length;
    }


    return (
        <div className="px-[5.5%] pt-[38px] pb-[90px]
                        max-[760px]:px-[4%] max-[760px]:pt-[26px] max-[760px]:pb-[70px]">
            {/* 標題區 */}
            <div className="mb-2 text-[10px] tracking-[.22em] text-[#76716c]">COUPONS</div>
            <h1 className="mb-3 text-[clamp(24px,3vw,34px)] font-medium tracking-[.08em]">我的折價券</h1>
            <div className="mb-8 text-[11px] tracking-[.06em] text-[#76716c]">
                {countOf("usable")} 張可使用<span className="mx-3">·</span>共 {couponList.length} 張
            </div>

            {/* 分頁籤 */}
            <div className="mb-6 flex gap-2">
                {TABS.map((t) => (
                    <button key={t.value} onClick={() => setTab(t.value)}
                            className={`border px-4 py-2 text-[11px] tracking-[.08em] transition-colors
                                        ${tab === t.value ? "border-black bg-black text-white" : "border-[#d6d0c7] hover:border-black"}`}>
                        {t.label} {countOf(t.value)}
                    </button>
                ))}
            </div>

            {/* 折價券 */}
            {shownList.length === 0 ? (
                <p className="py-16 text-center text-[13px] tracking-[.06em] text-[#76716c]">目前沒有折價券</p>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 max-[760px]:grid-cols-1">
                    {shownList.map((coupon) => (
                        <CouponCard key={coupon.id} coupon={coupon} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Coupons;
