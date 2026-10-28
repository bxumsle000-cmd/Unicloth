/**
 * 銷售數據頁的篩選條件列：有篩選時每個條件一個「女性 ✕」，加上清除按鈕；沒篩選時顯示提示文字
 * chipList：[{ name: 顯示的名稱, onRemove: 按 ✕ 時呼叫 }]，空陣列 = 沒篩選
 * hint：沒篩選時的提示文字；onClear：清除全部篩選
 */
function SalesFilterBar({ chipList, hint, onClear }) {
    if (chipList.length === 0) {
        return (
            <div className="mb-6 flex min-h-[40px] items-center text-[12px] tracking-[.06em] text-muted">{hint}</div>
        );
    }
    return (
        <div className="mb-6 flex min-h-[40px] flex-wrap items-center gap-3 text-[12px] tracking-[.06em]">
            <span className="text-muted">篩選中：</span>
            {chipList.map(chip => (
                <span key={chip.name} className="flex items-center gap-2 border border-black bg-white px-3 py-1.5">
                    {chip.name}
                    <button type="button" onClick={chip.onRemove} aria-label="取消篩選" className="text-muted hover:text-[#111]">✕</button>
                </span>
            ))}
            <button type="button" onClick={onClear} className="text-muted underline underline-offset-4 hover:text-[#111]">
                清除篩選
            </button>
        </div>
    )
}

export default SalesFilterBar;
