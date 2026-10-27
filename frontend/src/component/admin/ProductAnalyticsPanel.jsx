import { useEffect, useState } from "react";
import { adminApi } from "../../js/admin.js";
import { imgSrc, money } from "../../js/kinu.js";

const PERIOD_OPTIONS = [
    { days: 7, label: "最近 7 天" },
    { days: 30, label: "最近 30 天" },
    { days: 90, label: "最近 90 天" }
];

const TREND_STYLES = {
    NEW: "bg-[#e8f0e4] text-[#41603a]",
    UP: "bg-[#e8f0e4] text-[#41603a]",
    DOWN: "bg-[#f5e8e6] text-[#93483e]",
    STABLE: "bg-[#ece9e4] text-[#68615a]"
};

function ProductAnalyticsPanel() {
    const [days, setDays] = useState(30);
    const [refreshKey, setRefreshKey] = useState(0);
    const [items, setItems] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;

        setItems(null);
        setError("");

        adminApi(
            `/api/admin/product/analytics/trends?days=${days}&limit=20`
        )
            .then(data => {
                if (!ignore) {
                    setItems(data);
                }
            })
            .catch(requestError => {
                if (!ignore) {
                    setItems([]);
                    setError(requestError.message);
                }
            });

        return () => {
            ignore = true;
        };
    }, [days, refreshKey]);

    /**
     * 將趨勢狀態轉成後台顯示文字。
     */
    function getTrendText(item) {
        if (item.trend === "NEW") {
            return "新進榜";
        }

        if (item.trend === "STABLE") {
            return "持平";
        }

        const prefix =
            item.changePercent > 0
                ? "+"
                : "";

        return `${prefix}${item.changePercent}%`;
    }

    return (
        <section>
            {/* 標題與期間選擇 */}
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-[9px] tracking-[.22em] text-muted">
                        SALES ANALYTICS
                    </div>

                    <h1 className="mt-2 text-[24px] font-medium tracking-[.08em]">
                        商品銷售趨勢
                    </h1>

                    <p className="mt-2 text-[12px] leading-6 text-muted">
                        排除未付款與已取消訂單，並與上一個相同期間比較。
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {PERIOD_OPTIONS.map(option => (
                        <button
                            key={option.days}
                            type="button"
                            onClick={() => setDays(option.days)}
                            className={
                                "border px-4 py-2 text-[11px] tracking-[.06em] " +
                                (days === option.days
                                    ? "border-black bg-black text-white"
                                    : "border-line bg-white text-muted hover:text-black")
                            }
                        >
                            {option.label}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() =>
                            setRefreshKey(current => current + 1)
                        }
                        className="border border-line bg-white px-4 py-2 text-[11px] tracking-[.06em] text-muted hover:text-black"
                    >
                        重新整理
                    </button>
                </div>
            </div>

            {!items ? (
                <div className="border border-line bg-white py-20 text-center text-[12px] text-muted">
                    載入銷售資料中…
                </div>
            ) : error ? (
                <div className="border border-[#d9aaa4] bg-[#fff8f7] px-5 py-8 text-center text-[12px] text-[#93483e]">
                    {error}
                </div>
            ) : items.length === 0 ? (
                <div className="border border-line bg-white py-20 text-center text-[12px] text-muted">
                    這個期間目前沒有有效銷售資料
                </div>
            ) : (
                /* 熱銷排行與前期比較 */
                <div className="overflow-x-auto border border-line bg-white">
                    <table className="min-w-[920px] w-full border-collapse">
                        <thead>
                        <tr className="border-b border-line bg-[#f5f3ef] text-left text-[10px] tracking-[.08em] text-muted">
                            <th className="px-4 py-3 font-normal">排行</th>
                            <th className="px-4 py-3 font-normal">商品</th>
                            <th className="px-4 py-3 text-right font-normal">本期件數</th>
                            <th className="px-4 py-3 text-right font-normal">上期件數</th>
                            <th className="px-4 py-3 text-right font-normal">件數差異</th>
                            <th className="px-4 py-3 text-right font-normal">本期銷售額</th>
                            <th className="px-4 py-3 text-center font-normal">趨勢</th>
                        </tr>
                        </thead>

                        <tbody>
                        {items.map((item, index) => (
                            <tr
                                key={item.productId}
                                className="border-b border-line last:border-b-0"
                            >
                                <td className="px-4 py-4 text-[13px]">
                                    {index + 1}
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-14 shrink-0 bg-[#f0ebe3]">
                                            {item.imageUrl && (
                                                <img
                                                    src={imgSrc(item.imageUrl)}
                                                    alt=""
                                                    className="size-full object-cover mix-blend-multiply"
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-[13px]">
                                                {item.name}
                                            </div>

                                            <div className="mt-1 text-[10px] text-muted">
                                                {item.slug}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4 text-right text-[13px]">
                                    {item.currentUnitsSold}
                                </td>

                                <td className="px-4 py-4 text-right text-[13px] text-muted">
                                    {item.previousUnitsSold}
                                </td>

                                <td className={
                                        "px-4 py-4 text-right text-[13px] " +
                                        (item.unitChange > 0
                                            ? "text-[#41603a]"
                                            : item.unitChange < 0
                                                ? "text-[#93483e]"
                                                : "text-muted")
                                    }>
                                    {item.unitChange > 0
                                        ? `+${item.unitChange}`
                                        : item.unitChange}
                                </td>

                                <td className="px-4 py-4 text-right text-[13px]">
                                    {money(item.currentRevenue)}
                                </td>

                                <td className="px-4 py-4 text-center">
                                        <span className={
                                                  "inline-block min-w-[64px] px-2.5 py-1.5 text-[10px] tracking-[.06em] " +
                                                  TREND_STYLES[item.trend]
                                              }>
                                            {getTrendText(item)}
                                        </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default ProductAnalyticsPanel;