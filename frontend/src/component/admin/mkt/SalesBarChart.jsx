import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

const COLOR_BAR = '#2a78d6';     // 長條的顏色
const COLOR_FADED = '#c5d9f2';   // 有篩選時，沒被選到的長條

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true };

/** 有篩選時，被選到的長條維持原色，其他變淡；isSelectedList 全部是 false 代表沒篩選，全部原色 */
function barColorList(isSelectedList) {
    const hasSelected = isSelectedList.some(isSelected => isSelected);
    return isSelectedList.map(isSelected => (!hasSelected || isSelected) ? COLOR_BAR : COLOR_FADED);
}

/**
 * 長條圖（Plotly），銷售數據各頁共用
 * labelList：每根長條的名稱；valueList：數字；textList：長條旁邊顯示的字
 * hoverTemplate：滑鼠移上去顯示的格式
 * isSelectedList：每根有沒有被篩選選到（選到的維持原色，其他變淡）；不給就全部原色
 * horizontal：true = 橫條圖（由上往下第 1 名在最上面）
 * onClickBar：點長條時呼叫，傳入第幾根（從 0 開始）；不給就不能點
 * heightClass：圖的高度（Tailwind class）；textMargin：橫條圖右邊留給文字的寬度（px），文字比較長時加大
 * hoverTextList：每根長條滑鼠移上去顯示的文字（可以用 <br> 換行）；有給的話就不用 hoverTemplate
 */
function SalesBarChart({ labelList, valueList, textList, hoverTemplate, isSelectedList, horizontal = false, onClickBar,
                         heightClass = 'h-[300px]', textMargin = 96, hoverTextList }) {
    const chartRef = useRef(null);
    // 點擊事件只綁一次，所以用 ref 記住最新的 onClickBar，不然會一直呼叫到第一次畫圖時的舊函式
    const onClickBarRef = useRef(onClickBar);
    const isBoundRef = useRef(false);

    useEffect(() => {
        onClickBarRef.current = onClickBar;
    });

    useEffect(() => {
        // 橫條圖由下往上畫，所以整個反過來，第 1 名才會在最上面
        const order = list => horizontal ? list.slice().reverse() : list;
        const traceList = [{
            x: order(horizontal ? valueList : labelList),
            y: order(horizontal ? labelList : valueList),
            orientation: horizontal ? 'h' : 'v',
            type: 'bar',
            marker: { color: isSelectedList ? order(barColorList(isSelectedList)) : COLOR_BAR },
            text: order(textList),
            customdata: order(labelList.map((label, index) => index)),   // 原本是第幾根，點擊時用（橫條圖順序反過來了）
            textposition: 'outside',
            cliponaxis: false,
            hovertext: hoverTextList ? order(hoverTextList) : undefined,
            hovertemplate: (hoverTextList ? '%{hovertext}' : hoverTemplate) + '<extra></extra>',
        }];
        const hiddenAxis = { showticklabels: false, showgrid: false, zeroline: false };
        // type: 'category'：名稱照原樣當分類，不然像「2026/10」會被 Plotly 當成日期
        const labelAxis = { type: 'category', automargin: true, linecolor: '#dfd9d2', showgrid: false };
        const layout = {
            // 橫條圖右邊留空間給長條旁邊的文字
            margin: { l: 16, r: horizontal ? textMargin : 16, t: horizontal ? 8 : 24, b: horizontal ? 8 : 32 },
            paper_bgcolor: '#fff',
            plot_bgcolor: '#fff',
            font: { family: "'DM Sans', 'Noto Sans TC', sans-serif", size: 12, color: '#76716c' },
            hoverlabel: { bgcolor: '#fff', bordercolor: '#dfd9d2', font: { color: '#111' } },
            xaxis: horizontal ? hiddenAxis : labelAxis,
            yaxis: horizontal ? labelAxis : hiddenAxis,
            bargap: 0.35,
            showlegend: false,
            dragmode: false,   // 不能拖曳放大，點下去就是篩選
        };
        Plotly.react(chartRef.current, traceList, layout, PLOTLY_CONFIG);

        // 圖第一次畫完之後才能綁事件，之後 Plotly.react 重畫也會保留
        if (!isBoundRef.current) {
            chartRef.current.on('plotly_click', event => {
                onClickBarRef.current?.(event.points[0].customdata);
            });
            isBoundRef.current = true;
        }
    }, [labelList, valueList, textList, hoverTemplate, isSelectedList, horizontal, textMargin, hoverTextList]);

    // 離開頁面時把圖拆掉，釋放 Plotly 綁的事件
    // 拆掉後點擊事件也沒了，要讓下次畫圖時重新綁（開發模式 React 會故意拆掉再重畫一次，不重設就點不了）
    useEffect(() => {
        const chart = chartRef.current;
        return () => {
            Plotly.purge(chart);
            isBoundRef.current = false;
        };
    }, []);

    // 可以點的圖：游標改成手指（Plotly 預設是十字）
    return <div ref={chartRef} className={`mt-4 ${heightClass} ` + (onClickBar ? '[&_.nsewdrag]:cursor-pointer!' : '')}></div>;
}

export default SalesBarChart;
