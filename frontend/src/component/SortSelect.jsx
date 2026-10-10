/** 排序下拉選單：sort 是目前的排序值（例如 price,asc），選了新的就呼叫 onSortChange */
function SortSelect({ sort, setSort }) {
    return (
        <div className="mb-5 flex justify-end">
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="排序"
                    className="h-8 border border-[#dfd9d2] px-3 text-[11px] tracking-[.05em] outline-none focus:border-black">
                <option value="id,desc">最新上架</option>
                <option value="price,asc">價格：低到高</option>
                <option value="price,desc">價格：高到低</option>
            </select>
        </div>
    )
}

export default SortSelect;
