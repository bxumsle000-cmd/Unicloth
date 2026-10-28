/**
 * 取消分析：每一列是「付款方式 + 取消原因」，取消率 = 已取消 ÷ 下單數
 * cancelList：[{ name, reason, orders, cancelled, waiting, cancelRate }]
 */
function OrderCancelTable({ cancelList }) {
    return (
        <div className="border border-line bg-white p-6 max-[760px]:p-4">
            <h2 className="text-[14px] font-medium tracking-[.08em]">取消分析</h2>
            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                取消率 = 已取消 ÷ 下單數。「還沒有結果」是還不知道會不會被取消的訂單：線上付款是還在等付款，後台取消是還沒出貨的訂單
            </p>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-[13px] tracking-[.04em]">
                    <thead>
                    <tr className="border-b border-line text-left text-muted">
                        <th className="py-2.5 pr-4 font-normal">付款方式</th>
                        <th className="py-2.5 pr-4 font-normal">取消原因</th>
                        <th className="py-2.5 pr-4 text-right font-normal">下單數</th>
                        <th className="py-2.5 pr-4 text-right font-normal">已取消</th>
                        <th className="py-2.5 pr-4 text-right font-normal">還沒有結果</th>
                        <th className="py-2.5 text-right font-normal">取消率</th>
                    </tr>
                    </thead>
                    <tbody className="tabular-nums">
                    {cancelList.map(row => (
                        <tr key={row.name + row.reason} className="border-b border-line last:border-b-0">
                            <td className="py-2.5 pr-4">{row.name}</td>
                            <td className="py-2.5 pr-4 text-muted">{row.reason}</td>
                            <td className="py-2.5 pr-4 text-right">{row.orders.toLocaleString('zh-TW')}</td>
                            <td className="py-2.5 pr-4 text-right">{row.cancelled.toLocaleString('zh-TW')}</td>
                            <td className="py-2.5 pr-4 text-right">{row.waiting.toLocaleString('zh-TW')}</td>
                            <td className="py-2.5 text-right font-medium">{row.cancelRate === null ? '—' : `${row.cancelRate.toFixed(1)}%`}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default OrderCancelTable;
