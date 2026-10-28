// 指標卡片；upIsGood = 數字變大是不是好事（折扣變多不一定是好事，所以不上色）
const KPI_LIST = [
    { key: 'revenue',       name: '營業額',   money: true,  upIsGood: true },
    { key: 'avgOrderValue', name: '客單價',   money: true,  upIsGood: true },
    { key: 'items',         name: '銷售件數', money: false, upIsGood: true },
    { key: 'discount',      name: '折扣總額', money: true,  upIsGood: null },
];

const DELTA_UP_COLOR = '#008300';     // 指標變好
const DELTA_DOWN_COLOR = '#c0392b';   // 指標變差

/**
 * 營收總覽的四張指標卡片，第一張（營業額）放大顯示
 * summary：{ current: 本期指標, previous: 上一期指標 }
 */
function SalesKpiCards({ summary }) {
    return (
        <div className="mb-6 grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-4 max-[1200px]:grid-cols-3 max-[760px]:grid-cols-1">
            {KPI_LIST.map((kpi, index) => {
                const now = summary.current[kpi.key];
                const before = summary.previous[kpi.key];
                const isHero = index === 0;
                return (
                    // 寬度不夠排成一列時，營業額自己佔滿一整列
                    <div key={kpi.key}
                         className={'border border-line bg-white p-6 max-[760px]:p-4'
                             + (isHero ? ' max-[1200px]:col-span-3 max-[760px]:col-span-1' : '')}>
                        <div className="text-[12px] tracking-[.08em] text-muted">{kpi.name}</div>
                        <div className={'mt-2 font-semibold tracking-[.02em] ' + (isHero ? 'text-[48px] leading-none' : 'text-[24px]')}>
                            {kpi.money && <span className="mr-1 text-[0.5em] font-medium">NT$</span>}
                            {now.toLocaleString('zh-TW')}
                        </div>
                        <div className="mt-2 text-[12px] tracking-[.04em]">
                            <Delta now={now} before={before} upIsGood={kpi.upIsGood}/>
                            <span className="text-muted">
                                對比上一期
                                <span className="whitespace-nowrap">（{kpi.money ? 'NT$ ' : ''}{before.toLocaleString('zh-TW')}）</span>
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    )
}

/** ▲ 12.3% / ▼ 4.5%；上一期是 0 沒辦法算百分比，顯示 — */
function Delta({ now, before, upIsGood }) {
    if (before === 0) {
        return <span className="mr-1 text-muted">—</span>;
    }
    const percent = (now - before) / before * 100;
    const isUp = percent >= 0;
    let color = 'var(--color-muted)';
    if (upIsGood !== null) {
        color = isUp === upIsGood ? DELTA_UP_COLOR : DELTA_DOWN_COLOR;
    }
    return (
        <span className="mr-1" style={{ color: color }}>
            {isUp ? '▲' : '▼'} {Math.abs(percent).toFixed(1)}%
        </span>
    );
}

export default SalesKpiCards;
