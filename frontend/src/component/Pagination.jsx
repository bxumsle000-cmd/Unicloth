/**
 * 換頁按鈕：page 從 0 開始（跟後端一樣），畫面上顯示成 1、2、3…<br>
 * totalPages 是 /products 回來的 page.totalPages
 */
function Pagination({ page, totalPages, setPage }) {
    // 只有一頁（或還沒載入）就不用顯示
    if (!totalPages || totalPages <= 1) return null;

    const buttonClass = "inline-flex h-8 min-w-8 items-center justify-center border px-2.5 text-[11px] tracking-[.05em] transition";

    function goTo(newPage) {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    /**
     * 要顯示哪些頁碼：第一頁、最後一頁、目前頁前後各 2 頁，中間跳過的用 "…"<br>
     * 例：共 20 頁、目前第 10 頁（page = 9）→ [0, "…", 7, 8, 9, 10, 11, "…", 19]
     */
    function pageItems(page, totalPages) {
        const items = [];
        for (let i = 0; i < totalPages; i++) {
            const isEdge = i === 0 || i === totalPages - 1;
            const isNear = Math.abs(i - page) <= 2;
            if (isEdge || isNear) {
                items.push(i);
            } else if (items[items.length - 1] !== "…") {
                items.push("…");
            }
        }
        return items;
    }

    return (
        <nav className="mt-14 flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => goTo(page - 1)} disabled={page === 0}
                    className={`${buttonClass} border-[#dfd9d2] hover:border-black disabled:pointer-events-none disabled:opacity-40`}>
                上一頁
            </button>

            {pageItems(page, totalPages).map((item, i) =>
                item === "…" ? (
                    <span key={`gap-${i}`} className="px-1 text-[11px] text-[#76716c]">…</span>
                ) : (
                    <button key={item} onClick={() => goTo(item)}
                            className={`${buttonClass} ${item === page ? "border-black bg-black text-white" : "border-[#dfd9d2] hover:border-black"}`}>
                        {item + 1}
                    </button>
                )
            )}

            <button onClick={() => goTo(page + 1)} disabled={page === totalPages - 1}
                    className={`${buttonClass} border-[#dfd9d2] hover:border-black disabled:pointer-events-none disabled:opacity-40`}>
                下一頁
            </button>
        </nav>
    )
}



export default Pagination;
