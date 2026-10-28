import { useEffect, useState } from "react";
import { SALES_RANGE_OPTIONS, adminApi, fmtDate } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import ToggleButtons from "./ToggleButtons.jsx";
import SalesStatCards from "./SalesStatCards.jsx";
import CouponPerformanceTable from "./CouponPerformanceTable.jsx";
import CouponCompareTable from "./CouponCompareTable.jsx";

/** NT$ 1,234；null 顯示 — */
function moneyText(n) {
    return n === null ? '—' : `NT$ ${n.toLocaleString('zh-TW')}`;
}

/** part 佔 total 幾 %；total 是 0 顯示 — */
function percentText(part, total) {
    return total === 0 ? '—' : `${(part / total * 100).toFixed(1)}%`;
}

/**
 * 折價券成效子頁面：指標卡片、每張券的成效、有用券與沒用券的訂單
 */
function CouponPerformancePage() {
    const [range, setRange] = useState('30d');   // SALES_RANGE_OPTIONS 的 key
    // 後端回的資料（格式見 analytics/coupon_performance.py 的 get_coupon_performance）；null = 還沒載入完
    const [couponPerformance, setCouponPerformance] = useState(null);

    useEffect(() => {
        adminApi(`/api/admin/mkt/sales/coupons?range=${range}`)
            .then(setCouponPerformance)
            .catch((e) => toast(e.message, true));
    }, [range]);

    return (
        <section>
            {/* 標題 + 期間篩選 */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] tracking-[.22em] text-muted">SALES</div>
                    <h1 className="text-[24px] font-medium tracking-[.08em]">折價券成效</h1>
                    {couponPerformance && (
                        <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                            {fmtDate(couponPerformance.start)} ～ {fmtDate(couponPerformance.end)} ・ 券依發出時間（received_at），訂單依下單時間（created_at）
                        </p>
                    )}
                </div>
                <ToggleButtons optionList={SALES_RANGE_OPTIONS} currentKey={range} onChange={setRange}/>
            </div>

            {couponPerformance && (
                <>
                    <SalesStatCards cardList={couponCardList(couponPerformance.coupon)}
                                    gridClass="grid-cols-4 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1"/>
                    <CouponPerformanceTable couponList={couponPerformance.couponList}/>
                    <CouponCompareTable compareList={couponPerformance.compareList}/>
                </>
            )}
        </section>
    )
}

/** 四張指標卡片：發出張數、使用率、用券訂單營業額、折扣總額 */
function couponCardList(coupon) {
    return [
        { name: '發出張數', value: coupon.issued.toLocaleString('zh-TW'), note: `目前還有 ${coupon.usable.toLocaleString('zh-TW')} 張可使用` },
        { name: '使用率', value: percentText(coupon.used, coupon.issued), note: `已使用 ${coupon.used.toLocaleString('zh-TW')} 張` },
        {
            name: '用券訂單營業額',
            value: moneyText(coupon.couponRevenue),
            note: `佔營業額 ${percentText(coupon.couponRevenue, coupon.totalRevenue)}`,
        },
        {
            name: '折扣總額',
            value: moneyText(coupon.discount),
            note: `${coupon.couponOrders.toLocaleString('zh-TW')} 筆訂單用券・平均每筆折 ${moneyText(coupon.avgDiscount)}`,
        },
    ];
}

export default CouponPerformancePage;
