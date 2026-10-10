/** 篩選選項：filters 是 /api/categories/{code}/filters 回來的 { colors, sizes } */
function Filters({ filters }) {
    const chip = "inline-flex h-8 items-center border border-[#dfd9d2] px-3.5 text-[11px] tracking-[.05em] whitespace-nowrap transition hover:border-black";
    const row = "grid grid-cols-[70px_1fr] items-start gap-3.5 max-[760px]:grid-cols-1 max-[760px]:gap-2";
    const label = "pt-[9px] text-[10px] tracking-[.18em] text-[#76716c] max-[760px]:pt-0";

    return (
        <div className="mb-[30px] grid gap-[22px] border-b border-[#dfd9d2] pt-1.5 pb-7">
            {/* 顏色 */}
            <div className={row}>
                <div className={label}>顏色</div>
                <div className="flex flex-wrap gap-2">
                    {filters.colors.map((color) => (
                        <button key={color} className={chip}>{color}</button>
                    ))}
                </div>
            </div>

            {/* 尺寸 */}
            <div className={row}>
                <div className={label}>尺寸</div>
                <div className="flex flex-wrap gap-2">
                    {filters.sizes.map((size) => (
                        <button key={size} className={chip}>{size}</button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Filters;
