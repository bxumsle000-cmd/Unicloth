/**
 * 銷售數據頁的指標卡片（商品銷售、訂單結構用；營收總覽有對比上一期，另外用 SalesKpiCards）
 * cardList：[{ name, value: 已經排好版的文字, note: 卡片下方的說明, warning: true 會加「▲ 需要處理」 }]
 * gridClass：一排幾張（Tailwind class），寬度不夠時自動換行
 */
function SalesStatCards({ cardList, gridClass }) {
    return (
        <div className={`mb-6 grid gap-4 ${gridClass}`}>
            {cardList.map(card => (
                <div key={card.name} className="border border-line bg-white p-6 max-[760px]:p-4">
                    <div className="text-[12px] tracking-[.08em] text-muted">{card.name}</div>
                    <div className="mt-2 text-[28px] font-semibold tracking-[.02em]">
                        {card.value}
                        {card.warning && <span className="ml-2 text-[12px] font-medium text-[#b0413e]">▲ 需要處理</span>}
                    </div>
                    <div className="mt-1 text-[12px] tracking-[.04em] text-muted">{card.note}</div>
                </div>
            ))}
        </div>
    )
}

export default SalesStatCards;
