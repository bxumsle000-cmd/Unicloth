/** 有小數的百分比：12.3%；沒辦法算顯示 — */
function percentText(percent) {
    return percent === null ? '—' : `${percent.toFixed(1)}%`;
}

/**
 * 新客與回購客：人數、消費金額、各自佔比、平均每人消費
 * buyerTypeList：[{ name, buyers, buyerPercent, amount, amountPercent, avgAmount }]
 */
function MemberBuyerTypeTable({ buyerTypeList }) {
    return (
        <div className="mb-6 border border-line bg-white p-6 max-[760px]:p-4">
            <h2 className="text-[14px] font-medium tracking-[.08em]">新客與回購客</h2>
            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                只看這段期間有下單的會員。新客：第一筆有效訂單在這段期間內；回購客：這段期間之前就買過
            </p>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-[13px] tracking-[.04em]">
                    <thead>
                    <tr className="border-b border-line text-left text-muted">
                        <th className="py-2.5 pr-4 font-normal">顧客</th>
                        <th className="py-2.5 pr-4 text-right font-normal">人數</th>
                        <th className="py-2.5 pr-4 text-right font-normal">人數佔比</th>
                        <th className="py-2.5 pr-4 text-right font-normal">消費金額</th>
                        <th className="py-2.5 pr-4 text-right font-normal">金額佔比</th>
                        <th className="py-2.5 text-right font-normal">平均每人消費</th>
                    </tr>
                    </thead>
                    <tbody className="tabular-nums">
                    {buyerTypeList.map(row => (
                        <tr key={row.name} className="border-b border-line last:border-b-0">
                            <td className="py-2.5 pr-4">{row.name}</td>
                            <td className="py-2.5 pr-4 text-right">{row.buyers.toLocaleString('zh-TW')}</td>
                            <td className="py-2.5 pr-4 text-right">{percentText(row.buyerPercent)}</td>
                            <td className="py-2.5 pr-4 text-right">NT$ {row.amount.toLocaleString('zh-TW')}</td>
                            <td className="py-2.5 pr-4 text-right">{percentText(row.amountPercent)}</td>
                            <td className="py-2.5 text-right font-medium">
                                {row.avgAmount === null ? '—' : `NT$ ${row.avgAmount.toLocaleString('zh-TW')}`}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default MemberBuyerTypeTable;
