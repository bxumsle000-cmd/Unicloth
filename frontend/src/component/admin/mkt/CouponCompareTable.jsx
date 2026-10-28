/** NT$ 1,234；null 顯示 — */
function moneyText(n) {
    return n === null ? '—' : `NT$ ${n.toLocaleString('zh-TW')}`;
}

/**
 * 有用券與沒用券的訂單：上面一句話說客單價差多少，下面是兩邊的訂單數、營業額、平均折扣、客單價
 * compareList：[有用券, 沒用券]，每個是 { name, orders, orderPercent, revenue, avgDiscount, aov }
 */
function CouponCompareTable({ compareList }) {
    const [withCoupon, withoutCoupon] = compareList;
    const canCompare = withCoupon.aov !== null && withoutCoupon.aov !== null;
    const diff = canCompare ? withCoupon.aov - withoutCoupon.aov : 0;

    return (
        <div className="border border-line bg-white p-6 max-[760px]:p-4">
            <h3 className="text-[14px] font-medium tracking-[.08em]">有用券與沒用券的訂單</h3>
            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                這段期間的有效訂單。券都有消費門檻，有用券的訂單本來就比較大，客單價差距不全是券的功勞
            </p>
            <p className="mt-4 text-[14px] tracking-[.04em]">
                {canCompare ? (
                    <>
                        有用券的訂單，客單價比沒用券的{diff >= 0 ? '高' : '低'}
                        <b className="mx-1 font-semibold">{moneyText(Math.abs(diff))}</b>
                        <span className="text-muted">
                            （{diff >= 0 ? '+' : '−'}{(Math.abs(diff) / withoutCoupon.aov * 100).toFixed(1)}%）
                        </span>
                    </>
                ) : '這段期間沒有足夠的訂單可以比較'}
            </p>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-[13px] tracking-[.04em]">
                    <thead>
                    <tr className="border-b border-line text-left text-muted">
                        <th className="py-2.5 pr-4 font-normal">訂單</th>
                        <th className="py-2.5 pr-4 text-right font-normal">訂單數</th>
                        <th className="py-2.5 pr-4 text-right font-normal">訂單佔比</th>
                        <th className="py-2.5 pr-4 text-right font-normal">營業額</th>
                        <th className="py-2.5 pr-4 text-right font-normal">平均折扣</th>
                        <th className="py-2.5 text-right font-normal">客單價</th>
                    </tr>
                    </thead>
                    <tbody className="tabular-nums">
                    {compareList.map(row => (
                        <tr key={row.name} className="border-b border-line last:border-b-0">
                            <td className="py-2.5 pr-4">{row.name}</td>
                            <td className="py-2.5 pr-4 text-right">{row.orders.toLocaleString('zh-TW')}</td>
                            <td className="py-2.5 pr-4 text-right">{row.orderPercent === null ? '—' : `${row.orderPercent.toFixed(1)}%`}</td>
                            <td className="py-2.5 pr-4 text-right">{moneyText(row.revenue)}</td>
                            <td className="py-2.5 pr-4 text-right">{moneyText(row.avgDiscount)}</td>
                            <td className="py-2.5 text-right font-medium">{moneyText(row.aov)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CouponCompareTable;
