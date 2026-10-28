import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";
import { fmtDate } from "../../../js/admin.js";

const COLOR_CURRENT = '#2a78d6';    // 本期
const COLOR_PREVIOUS = '#b5afa8';   // 上期（比較用，刻意淡一點）

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true };

/**
 * 營業額趨勢圖：實線是本期，灰色虛線是上一期同樣長度的期間
 * overview：後端回的資料，用到 unit、daily、previousDaily
 */
function RevenueChart({ overview }) {
    // Plotly 要直接畫在一個 div 上，用 ref 拿到那個 div
    const chartRef = useRef(null);

    useEffect(() => {
        const isMonth = overview.unit === 'month';
        const dateList = overview.daily.map(day => day.date);
        const traceList = [
            {
                name: '本期',
                x: dateList,
                y: overview.daily.map(day => day.revenue),
                type: 'scatter',
                // 點太多時只畫線，不畫圓點
                mode: overview.daily.length > 31 ? 'lines' : 'lines+markers',
                line: { color: COLOR_CURRENT, width: 2 },
                marker: { size: 8 },
                hovertemplate: 'NT$ %{y:,}',
            },
            {
                // 上期畫在本期的日期上，才能對齊比較；hover 時顯示真正的上期日期
                name: '上一期',
                x: dateList,
                y: overview.previousDaily.map(day => day.revenue),
                customdata: overview.previousDaily.map(day => isMonth ? fmtDate(day.date).slice(0, 7) : fmtDate(day.date)),
                type: 'scatter',
                mode: 'lines',
                line: { color: COLOR_PREVIOUS, width: 2, dash: 'dash' },
                hovertemplate: 'NT$ %{y:,}（%{customdata}）',
            },
        ];
        const layout = {
            margin: { l: 72, r: 16, t: 8, b: 40 },
            paper_bgcolor: '#fff',
            plot_bgcolor: '#fff',
            font: { family: "'DM Sans', 'Noto Sans TC', sans-serif", size: 12, color: '#76716c' },
            hovermode: 'x unified',
            hoverlabel: { bgcolor: '#fff', bordercolor: '#dfd9d2', font: { color: '#111' } },
            xaxis: {
                showgrid: false,
                linecolor: '#dfd9d2',
                tickformat: isMonth ? '%Y/%m' : '%m/%d',
                hoverformat: isMonth ? '%Y/%m' : '%Y/%m/%d',
            },
            yaxis: { gridcolor: '#efebe6', zeroline: false, rangemode: 'tozero', separatethousands: true, tickprefix: 'NT$ ' },
            legend: { orientation: 'h', x: 0, y: 1.12 },
        };
        // react：已經畫過就只更新資料，不會整張重畫
        Plotly.react(chartRef.current, traceList, layout, PLOTLY_CONFIG);
    }, [overview]);

    // 離開頁面時把圖拆掉，釋放 Plotly 綁的事件
    useEffect(() => {
        const chart = chartRef.current;
        return () => Plotly.purge(chart);
    }, []);

    return (
        <div className="mb-6 border border-line bg-white p-6 max-[760px]:p-4">
            <h2 className="text-[14px] font-medium tracking-[.08em]">營業額趨勢</h2>
            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">實線是本期，灰色虛線是上一期同樣長度的期間</p>
            <div ref={chartRef} className="mt-4 h-[320px]"></div>
        </div>
    )
}

export default RevenueChart;
