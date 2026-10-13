import { Link } from "react-router-dom";

/** 下一層分類按鈕：items 是 /api/categories/{code} 回來的 children */
function SubCategories({ children }) {
    // 最底層分類沒有下一層，不顯示
    if (children.length === 0) return null;

    return (
        <div className="mt-6 flex flex-wrap gap-2">
            {children.map((child) => (
                <Link key={child.code} to={`/category/${child.code}`}
                      className="inline-flex h-8 items-center border border-[#dfd9d2] px-3.5 text-[11px] tracking-[.05em]
                                 whitespace-nowrap transition hover:border-black">
                    {child.name}
                </Link>
            ))}
        </div>
    )
}

export default SubCategories;
