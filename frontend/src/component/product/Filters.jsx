import { useState } from "react";
import { sortSizes } from "../../js/kinu.js";

/**
 * 篩選選項：filters 是 /api/categories/{code}/filters 回來的 { colors, sizes }<br>
 * selectedFilters 是目前選了哪些 { colors, sizes, minPrice, maxPrice }，由 Category 保管
 */
function Filters({ filters, selectedFilters, setSelectedFilters }) {
    const filterButtonClass = "inline-flex h-8 items-center border px-3.5 text-[11px] tracking-[.05em] whitespace-nowrap transition hover:border-black";
    // 已選的按鈕黑底白字，未選的淺框
    const selectedButtonClass = `${filterButtonClass} border-black bg-black text-white`;
    const unselectedButtonClass = `${filterButtonClass} border-[#dfd9d2]`;
    const filterGridClass = "grid grid-cols-[70px_1fr] items-start gap-3.5 max-[760px]:grid-cols-1 max-[760px]:gap-2";
    const filterLabelClass = "pt-[9px] text-[10px] tracking-[.18em] text-[#76716c] max-[760px]:pt-0";
    const priceInputClass = "h-8 w-[110px] border border-[#dfd9d2] px-3 text-[11px] tracking-[.05em] outline-none focus:border-black";

    // 價格輸入框打字時先存在這裡，按「套用價格」才送出
    const [minPrice, setMinPrice] = useState(selectedFilters.minPrice);
    const [maxPrice, setMaxPrice] = useState(selectedFilters.maxPrice);

    /** 點一下加入、再點一下移除；filterType 是 "colors" 或 "sizes"，option 是被點的那個顏色或尺寸 */
    function toggle(filterType, option) {
        const selectedList = selectedFilters[filterType];
        const updateSelectedList = selectedList.includes(option)
            ? selectedList.filter((selected) => selected !== option)
            : [...selectedList, option];
        setSelectedFilters({ ...selectedFilters, [filterType]: updateSelectedList });
    }

    function applyPrice() {
        setSelectedFilters({...selectedFilters, minPrice, maxPrice});
    }

    function clearAll() {
        setMinPrice("");
        setMaxPrice("");
        setSelectedFilters({ colors: [], sizes: [], minPrice: "", maxPrice: "" });
    }

    return (
        <div className="pt-[18px] mb-[30px] grid gap-[22px] border-b border-[#dfd9d2] pt-1.5 pb-7">
            {/* 顏色 */}
            <div className={filterGridClass}>
                <div className={filterLabelClass}>顏色</div>
                <div className="flex flex-wrap gap-2">
                    {filters.colors.map((color) => (
                        <button key={color} onClick={() => toggle("colors", color)}
                                className={selectedFilters.colors.includes(color) ? selectedButtonClass : unselectedButtonClass}>{color}</button>
                    ))}
                </div>
            </div>

            {/* 尺寸 */}
            <div className={filterGridClass}>
                <div className={filterLabelClass}>尺寸</div>
                <div className="flex flex-wrap gap-2">
                    {sortSizes(filters.sizes).map((size) => (
                        <button key={size} onClick={() => toggle("sizes", size)}
                                className={selectedFilters.sizes.includes(size) ? selectedButtonClass : unselectedButtonClass}>{size}</button>
                    ))}
                </div>
            </div>

            {/* 價格 */}
            <div className={filterGridClass}>
                <div className={filterLabelClass}>價格</div>
                <div className="flex flex-wrap items-center gap-2">
                    <input type="number" min="0" step="100" placeholder="最低" className={priceInputClass}
                           value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                    <span className="text-[11px] text-[#76716c]">—</span>
                    <input type="number" min="0" step="100" placeholder="最高" className={priceInputClass}
                           value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                    <button onClick={applyPrice}
                            className="ml-1.5 h-8 bg-black px-4 text-[11px] tracking-[.1em] text-white transition hover:opacity-80">套用價格</button>
                </div>
            </div>

            {/*清除所有篩選*/}
            <button onClick={clearAll}
                    className="justify-self-end text-[14px] tracking-[.1em] underline underline-offset-4 mx-5
                    hover:no-underline  transition hover:text-black">
                清除所有篩選
            </button>
        </div>
    )
}

export default Filters;
