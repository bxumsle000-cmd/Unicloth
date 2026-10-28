import { useState } from "react";
import { adminDownload } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";

const inputClass = "border border-line px-3 py-2 text-[13px] text-[#111] focus:border-black focus:outline-none";

/**
 * 營收總覽匯出 Excel：選起訖日期，每天一列（日期、營業額、客單價、銷售件數、折扣總額）
 * overview：後端回的資料；日期預設帶入目前選的期間，可選範圍是 minDate（最早有訂單的那天）～ maxDate（昨天）
 */
function SalesExportForm({ overview }) {
    const [start, setStart] = useState(overview.start);   // 格式 2026-10-01
    const [end, setEnd] = useState(overview.end);
    const [isExporting, setIsExporting] = useState(false); // 下載中先擋住按鈕，避免連按

    async function exportExcel() {
        if (!start || !end) {
            toast('請選擇開始和結束日期', true);
            return;
        }
        if (start > end) {
            toast('開始日期不能晚於結束日期', true);
            return;
        }
        setIsExporting(true);
        try {
            await adminDownload(`/api/admin/mkt/sales/overview/export?start=${start}&end=${end}`,
                `營收總覽_${start}_${end}.xlsx`);
        } catch (e) {
            toast(e.message, true);
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="border border-line bg-white p-6 max-[760px]:p-4">
            <h2 className="text-[14px] font-medium tracking-[.08em]">匯出 Excel</h2>
            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">每天一列：日期、營業額、客單價、銷售件數、折扣總額</p>
            <div className="mt-4 flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-1.5 text-[12px] tracking-[.06em] text-muted">
                    開始日期
                    <input type="date" value={start} min={overview.minDate ?? undefined} max={end || overview.maxDate}
                           onChange={(e) => setStart(e.target.value)} className={inputClass}/>
                </label>
                <span className="pb-2.5 text-muted">～</span>
                <label className="flex flex-col gap-1.5 text-[12px] tracking-[.06em] text-muted">
                    結束日期
                    <input type="date" value={end} min={start || overview.minDate || undefined} max={overview.maxDate}
                           onChange={(e) => setEnd(e.target.value)} className={inputClass}/>
                </label>
                <button type="button" onClick={exportExcel} disabled={isExporting}
                        className="bg-black px-6 py-2.5 text-[13px] tracking-[.08em] text-white hover:bg-[#333] disabled:opacity-50">
                    {isExporting ? '匯出中…' : '匯出 Excel'}
                </button>
            </div>
        </div>
    )
}

export default SalesExportForm;
