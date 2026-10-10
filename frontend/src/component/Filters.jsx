/** 篩選選項：filters 是 /api/categories/{code}/filters 回來的 { colors, sizes } */
function Filters({ filters }) {
    const filterButtonClass = "inline-flex h-8 items-center border border-[#dfd9d2] px-3.5 text-[11px] tracking-[.05em] whitespace-nowrap transition hover:border-black";
    const filterGridClass = "grid grid-cols-[70px_1fr] items-start gap-3.5 max-[760px]:grid-cols-1 max-[760px]:gap-2";
    const filterLabelClass = "pt-[9px] text-[10px] tracking-[.18em] text-[#76716c] max-[760px]:pt-0";
    const priceInputClass = "h-8 w-[110px] border border-[#dfd9d2] px-3 text-[11px] tracking-[.05em] outline-none focus:border-black";

    return (
        <div className="mb-[30px] grid gap-[22px] border-b border-[#dfd9d2] pt-1.5 pb-7">
            {/* 顏色 */}
            <div className={filterGridClass}>
                <div className={filterLabelClass}>顏色</div>
                <div className="flex flex-wrap gap-2">
                    {filters.colors.map((color) => (
                        <button key={color} className={filterButtonClass}>{color}</button>
                    ))}
                </div>
            </div>

            {/* 尺寸 */}
            <div className={filterGridClass}>
                <div className={filterLabelClass}>尺寸</div>
                <div className="flex flex-wrap gap-2">
                    {filters.sizes.map((size) => (
                        <button key={size} className={filterButtonClass}>{size}</button>
                    ))}
                </div>
            </div>

            {/* 價格 */}
            <div className={filterGridClass}>
                <div className={filterLabelClass}>價格</div>
                <div className="flex flex-wrap items-center gap-2">
                    <input type="number" min="0" step="100" placeholder="最低" className={priceInputClass} />
                    <span className="text-[11px] text-[#76716c]">—</span>
                    <input type="number" min="0" step="100" placeholder="最高" className={priceInputClass} />
                    <button className="ml-1.5 h-8 bg-black px-4 text-[11px] tracking-[.1em] text-white transition hover:opacity-80">套用價格</button>
                </div>
            </div>
        </div>
    )
}

export default Filters;
