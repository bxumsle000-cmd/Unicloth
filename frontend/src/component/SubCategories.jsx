/** 下一層分類按鈕：items 是 /api/categories/{code} 回來的 children */
function SubCategories({ children }) {
    return (
        <div className="mt-6 flex flex-wrap gap-2">
            {children.map((child) => (
                <button key={child.code}
                        className="inline-flex h-8 items-center border border-[#dfd9d2] px-3.5 text-[11px] tracking-[.05em]
                                   whitespace-nowrap transition hover:border-black">
                    {child.name}
                </button>
            ))}
        </div>
    )
}

export default SubCategories;
