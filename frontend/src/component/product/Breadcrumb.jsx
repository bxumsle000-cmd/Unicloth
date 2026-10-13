import { Link } from "react-router-dom";

/** 麵包屑：items 是 /api/categories/{code}/breadcrumb 回來的陣列 */
function Breadcrumb({ breadcrumb }) {
    return (
        <nav className="mb-[18px] flex flex-wrap gap-2 text-[10px] tracking-[.08em] text-[#76716c]">
            {breadcrumb.map((b, i) => (
                <Link key={b.code} className="flex gap-2" to={`/category/${b.code}`}>
                    {i > 0 && <span>/</span>}
                    <span>{b.name}</span>
                </Link>
            ))}
        </nav>
    )
}

export default Breadcrumb;
