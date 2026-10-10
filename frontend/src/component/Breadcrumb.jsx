/** 麵包屑：items 是 /api/categories/{code}/breadcrumb 回來的陣列 */
function Breadcrumb({ breadcrumb }) {
    return (
        <nav className="mb-[18px] flex flex-wrap gap-2 text-[10px] tracking-[.08em] text-[#76716c]">
            {breadcrumb.map((b, i) => (
                <span key={b.code} className="flex gap-2">
                    {i > 0 && <span>/</span>}
                    <span>{b.name}</span>
                </span>
            ))}
        </nav>
    )
}

export default Breadcrumb;
