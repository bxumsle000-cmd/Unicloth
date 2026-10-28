/** NT$ 1,234；null 顯示 — */
function moneyText(n) {
    return n === null ? '—' : `NT$ ${n.toLocaleString('zh-TW')}`;
}

/** 券的使用條件，例如「滿 990 折 100 元」「滿 2,000 打 85 折」 */
function ruleText(coupon) {
    const min = coupon.minSubtotal.toLocaleString('zh-TW');
    if (coupon.type === 'AMOUNT') return `滿 ${min} 折 ${coupon.value} 元`;
    const rest = 100 - coupon.value;   // value = 10 → 剩 90% → 9 折
    return `滿 ${min} 打 ${rest % 10 === 0 ? rest / 10 : rest} 折`;
}

/**
 * 每張券的成效：發出、使用率用這段期間發出的券；訂單數、營業額、折扣成本用這段期間用這張券的有效訂單
 * couponList：後端依營業額排好的 [{ code, title, type, value, minSubtotal, autoTrigger, isActive, issued, used, useRate, orders, revenue, discount, avgDiscount }]
 */
function CouponPerformanceTable({ couponList }) {
    return (
        <div className="mb-6 border border-line bg-white p-6 max-[760px]:p-4">
            <h3 className="text-[14px] font-medium tracking-[.08em]">每張券的成效</h3>
            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                發出、使用率：這段期間發出的券；訂單數、營業額、折扣成本：這段期間用這張券下的有效訂單。依營業額排序
            </p>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[880px] text-[13px] tracking-[.04em]">
                    <thead>
                    <tr className="border-b border-line text-left text-muted">
                        <th className="py-2.5 pr-4 font-normal">折價券</th>
                        <th className="py-2.5 pr-4 font-normal">發送方式</th>
                        <th className="py-2.5 pr-4 text-right font-normal">發出</th>
                        <th className="py-2.5 pr-4 font-normal">使用率</th>
                        <th className="py-2.5 pr-4 text-right font-normal">訂單數</th>
                        <th className="py-2.5 pr-4 text-right font-normal">營業額</th>
                        <th className="py-2.5 pr-4 text-right font-normal">折扣成本</th>
                        <th className="py-2.5 text-right font-normal">平均每筆折扣</th>
                    </tr>
                    </thead>
                    <tbody className="tabular-nums">
                    {couponList.length === 0 ? (
                        <tr><td colSpan="8" className="py-6 text-center text-muted">這段期間沒有發券，也沒有人用券</td></tr>
                    ) : couponList.map(coupon => (
                        <tr key={coupon.id} className="border-b border-line last:border-b-0">
                            <td className="py-3 pr-4">
                                <div className="flex items-center">
                                    <span className="font-medium">{coupon.code}</span>
                                    {!coupon.isActive && (
                                        <span className="ml-2 border border-line px-1.5 py-0.5 text-[11px] text-muted">已停用</span>
                                    )}
                                </div>
                                <div className="mt-0.5 text-[12px] text-muted">{coupon.title}・{ruleText(coupon)}</div>
                            </td>
                            <td className="py-3 pr-4">{coupon.autoTrigger === 'BIRTHDAY' ? '生日禮' : '手動'}</td>
                            <td className="py-3 pr-4 text-right">{coupon.issued.toLocaleString('zh-TW')}</td>
                            <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-[72px] rounded-full bg-[#e6eef9]">
                                        <div className="h-1.5 rounded-full bg-[#2a78d6]" style={{ width: `${coupon.useRate ?? 0}%` }}></div>
                                    </div>
                                    <span>{coupon.useRate === null ? '—' : `${coupon.useRate.toFixed(1)}%`}</span>
                                </div>
                            </td>
                            <td className="py-3 pr-4 text-right">{coupon.orders.toLocaleString('zh-TW')}</td>
                            <td className="py-3 pr-4 text-right font-medium">{moneyText(coupon.revenue)}</td>
                            <td className="py-3 pr-4 text-right">{moneyText(coupon.discount)}</td>
                            <td className="py-3 text-right">{moneyText(coupon.avgDiscount)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CouponPerformanceTable;
