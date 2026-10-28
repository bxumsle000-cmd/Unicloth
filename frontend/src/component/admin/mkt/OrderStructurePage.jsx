import { useEffect, useState } from "react";
import { SALES_RANGE_OPTIONS, adminApi, fmtDate } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import ToggleButtons from "./ToggleButtons.jsx";
import SalesFilterBar from "./SalesFilterBar.jsx";
import SalesStatCards from "./SalesStatCards.jsx";
import SalesBarChart from "./SalesBarChart.jsx";
import OrderShippingSpeed from "./OrderShippingSpeed.jsx";
import OrderCancelTable from "./OrderCancelTable.jsx";

/** 長條旁邊的字：「12 筆（34.5%）」 */
function countTextList(countList) {
    const total = countList.reduce((sum, n) => sum + n, 0);
    return countList.map(n => `${n.toLocaleString('zh-TW')} 筆（${total === 0 ? '—' : (n / total * 100).toFixed(1) + '%'}）`);
}

/**
 * 訂單結構子頁面：期間按鈕、篩選列、指標卡片、配送／付款方式、訂單狀態、出貨速度、配送天數、取消分析<br>
 * 點配送方式的長條可以篩選，篩選後重新跟 Python 要資料（配送方式圖本身不受篩選影響）
 */
function OrderStructurePage() {
    const [range, setRange] = useState('30d');      // SALES_RANGE_OPTIONS 的 key
    const [shipping, setShipping] = useState(null); // 篩選的配送方式：null = 不篩選、'HOME'、'CVS'
    // 後端回的資料（格式見 analytics/order_structure.py 的 get_order_structure）；null = 還沒載入完
    const [orderStructure, setOrderStructure] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams({ range: range });
        if (shipping !== null) params.set('shipping', shipping);
        adminApi(`/api/admin/mkt/sales/orders?${params}`)
            .then(setOrderStructure)
            .catch((e) => toast(e.message, true));
    }, [range, shipping]);

    // 點配送方式：點同一個就取消，否則換成這個
    function clickShipping(method) {
        setShipping(shipping === method.key ? null : method.key);
    }

    return (
        <section>
            {/* 標題 + 期間篩選 */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] tracking-[.22em] text-muted">SALES</div>
                    <h1 className="text-[24px] font-medium tracking-[.08em]">訂單結構</h1>
                    {orderStructure && (
                        <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                            {fmtDate(orderStructure.start)} ～ {fmtDate(orderStructure.end)} ・ 依下單時間（created_at）
                        </p>
                    )}
                </div>
                <ToggleButtons optionList={SALES_RANGE_OPTIONS} currentKey={range} onChange={setRange}/>
            </div>

            {orderStructure && (
                <>
                    <SalesFilterBar onClear={() => setShipping(null)}
                                    chipList={orderStructure.filter.shipping
                                        ? [{ name: orderStructure.filter.shipping.name, onRemove: () => setShipping(null) }]
                                        : []}
                                    hint="目前顯示全部訂單。點下方「配送方式」的長條，整頁會跟著篩選"/>
                    <SalesStatCards cardList={kpiCardList(orderStructure.kpi)}
                                    gridClass="grid-cols-4 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1"/>

                    {/* 配送方式（篩選器）、付款方式 */}
                    <div className="mb-6 grid grid-cols-2 gap-6 max-[1100px]:grid-cols-1">
                        <div className="border border-line bg-white p-6 max-[760px]:p-4">
                            <h2 className="text-[14px] font-medium tracking-[.08em]">配送方式</h2>
                            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">有效訂單的筆數和佔比；點長條可以篩選整頁，再點一次取消</p>
                            <SalesBarChart horizontal heightClass="h-[200px]" textMargin={130}
                                           labelList={orderStructure.shippingList.map(method => method.name)}
                                           valueList={orderStructure.shippingList.map(method => method.count)}
                                           textList={countTextList(orderStructure.shippingList.map(method => method.count))}
                                           hoverTemplate="%{y}<br>%{x:,} 筆"
                                           isSelectedList={orderStructure.shippingList.map(method => method.key === shipping)}
                                           onClickBar={index => clickShipping(orderStructure.shippingList[index])}/>
                        </div>
                        <div className="border border-line bg-white p-6 max-[760px]:p-4">
                            <h2 className="text-[14px] font-medium tracking-[.08em]">付款方式</h2>
                            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">有效訂單（不含未付款、已取消）的筆數和佔比</p>
                            <SalesBarChart horizontal heightClass="h-[200px]" textMargin={130}
                                           labelList={orderStructure.paymentList.map(method => method.name)}
                                           valueList={orderStructure.paymentList.map(method => method.count)}
                                           textList={countTextList(orderStructure.paymentList.map(method => method.count))}
                                           hoverTemplate="%{y}<br>%{x:,} 筆"/>
                        </div>
                    </div>

                    {/* 訂單狀態分布 */}
                    <div className="mb-6 border border-line bg-white p-6 max-[760px]:p-4">
                        <h2 className="text-[14px] font-medium tracking-[.08em]">訂單狀態分布</h2>
                        <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                            這段期間下的全部訂單，現在停在哪個狀態；照訂單流程排序。超商取貨的「已送達」代表已到店、還沒取貨
                        </p>
                        <SalesBarChart horizontal heightClass="h-[280px]" textMargin={130}
                                       labelList={orderStructure.statusList.map(status => status.name)}
                                       valueList={orderStructure.statusList.map(status => status.count)}
                                       textList={countTextList(orderStructure.statusList.map(status => status.count))}
                                       hoverTemplate="%{y}<br>%{x:,} 筆"/>
                    </div>

                    <OrderShippingSpeed shipSpeedList={orderStructure.shipSpeedList} deliverList={orderStructure.deliverList}/>
                    <OrderCancelTable cancelList={orderStructure.cancelList}/>
                </>
            )}
        </section>
    )
}

/** 四張指標卡片：訂單數、取消率、平均出貨天數、待出貨超過 3 天 */
function kpiCardList(kpi) {
    return [
        { name: '訂單數', value: kpi.orders.toLocaleString('zh-TW'), note: '全部訂單，含未付款、已取消' },
        { name: '取消率', value: kpi.cancelRate === null ? '—' : `${kpi.cancelRate.toFixed(1)}%`, note: '已取消 ÷ 訂單數' },
        { name: '平均出貨天數', value: kpi.avgShipDays === null ? '—' : `${kpi.avgShipDays.toFixed(1)} 天`, note: '訂單成立 → 出貨' },
        {
            name: '待出貨超過 3 天',
            value: kpi.latePending.toLocaleString('zh-TW'),
            note: '目前的數字，不受期間影響',
            warning: kpi.latePending > 0,
        },
    ];
}

export default OrderStructurePage;
