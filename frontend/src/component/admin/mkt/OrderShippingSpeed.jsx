import SalesBarChart from "./SalesBarChart.jsx";

/**
 * 出貨速度（訂單成立 → 出貨的天數分布）、配送天數（宅配、超商各段平均幾天）
 * shipSpeedList：[{ name: '當天', count }]；deliverList：[{ name, unit, avgDays, count }]
 */
function OrderShippingSpeed({ shipSpeedList, deliverList }) {
    const total = shipSpeedList.reduce((sum, row) => sum + row.count, 0);

    return (
        <div className="mb-6 grid grid-cols-[3fr_2fr] gap-6 max-[1100px]:grid-cols-1">
            <div className="border border-line bg-white p-6 max-[760px]:p-4">
                <h2 className="text-[14px] font-medium tracking-[.08em]">出貨速度</h2>
                <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                    從訂單成立到出貨花了幾天。訂單成立：信用卡、ATM 是付款時間（paid_at），貨到付款是下單時間（created_at）
                </p>
                <SalesBarChart heightClass="h-[260px]"
                               labelList={shipSpeedList.map(row => row.name)}
                               valueList={shipSpeedList.map(row => row.count)}
                               textList={shipSpeedList.map(row => total === 0 ? '—' : `${(row.count / total * 100).toFixed(1)}%`)}
                               hoverTemplate="%{x}出貨<br>%{y:,} 筆"/>
            </div>
            <div className="border border-line bg-white p-6 max-[760px]:p-4">
                <h2 className="text-[14px] font-medium tracking-[.08em]">配送天數</h2>
                <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                    出貨 → 送達：delivered_at - shipped_at；到店 → 取貨：completed_at - delivered_at
                </p>
                <div className="mt-6 flex flex-col gap-6">
                    {deliverList.map(item => (
                        <div key={item.name}>
                            <div className="text-[12px] tracking-[.08em] text-muted">{item.name}</div>
                            <div className="mt-1 text-[28px] font-semibold tracking-[.02em]">
                                {item.avgDays === null ? '—' : `${item.avgDays.toFixed(1)} 天`}
                            </div>
                            <div className="text-[12px] tracking-[.04em] text-muted">{item.unit} {item.count.toLocaleString('zh-TW')} 筆</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default OrderShippingSpeed;
