import { useEffect, useState } from "react";
import { SALES_RANGE_OPTIONS, adminApi, fmtDate } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import SalesKpiCards from "./SalesKpiCards.jsx";
import RevenueChart from "./RevenueChart.jsx";
import SalesExportForm from "./SalesExportForm.jsx";
import ToggleButtons from "./ToggleButtons.jsx";

/**
 * 營收總覽子頁面：期間按鈕、指標卡片、營業額趨勢圖、匯出 Excel<br>
 * 數字都是 Python 算好的（React → Spring Boot /api/admin/mkt/sales → Python）
 */
function SalesOverviewPage() {
    const [range, setRange] = useState('30d');   // SALES_RANGE_OPTIONS 的 key
    // 後端回的資料：start、end、unit、summary（本期／上期指標）、daily、previousDaily、minDate、maxDate；null = 還沒載入完
    const [overview, setOverview] = useState(null);

    useEffect(() => {
        adminApi(`/api/admin/mkt/sales/overview?range=${range}`)
            .then(setOverview)
            .catch((e) => toast(e.message, true));
    }, [range]);

    return (
        <section>
            {/* 標題 + 期間篩選 */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] tracking-[.22em] text-muted">SALES</div>
                    <h1 className="text-[24px] font-medium tracking-[.08em]">營收總覽</h1>
                    {overview && (
                        <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                            {fmtDate(overview.start)} ～ {fmtDate(overview.end)} ・ 只計算有效訂單（不含未付款、已取消），營業額不含運費
                        </p>
                    )}
                </div>
                <ToggleButtons optionList={SALES_RANGE_OPTIONS} currentKey={range} onChange={setRange}/>
            </div>

            {overview && (
                <>
                    <SalesKpiCards summary={overview.summary}/>
                    <RevenueChart overview={overview}/>
                    {/* key 換期間就重建，日期才會重新帶入目前選的期間 */}
                    <SalesExportForm key={overview.start + overview.end} overview={overview}/>
                </>
            )}
        </section>
    )
}

export default SalesOverviewPage;
