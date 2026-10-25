import { useState } from "react";
import { COUPON_TRIGGERS, discountText } from "../../../js/admin.js";
import { money } from "../../../js/kinu.js";

const smallButtonClass = "ml-2 border border-line px-2.5 py-1 text-[12px] hover:border-black";
const filterClass = "border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black";

/**
 * 折價券篩選列 + 表格<br>
 * couponList 是後端 AdminCouponResponse 的陣列（全部的券），篩選在這裡做；編輯用 onEdit 開視窗，停用／啟用直接呼叫 onToggleActive
 */
function CouponTable({ couponList, onEdit, onToggleActive }) {
    // 篩選條件，'' = 不篩
    const [keyword, setKeyword] = useState('');
    const [activeFilter, setActiveFilter] = useState('');   // 'true' | 'false'
    const [triggerFilter, setTriggerFilter] = useState(''); // 'NONE' = 不自動發送；其他是 COUPON_TRIGGERS 的 key

    const trimmedKeyword = keyword.trim().toLowerCase();
    const filteredCoupons = couponList.filter(coupon =>
        (!trimmedKeyword || coupon.code.toLowerCase().includes(trimmedKeyword) || coupon.title.toLowerCase().includes(trimmedKeyword)) &&
        (!activeFilter || String(coupon.active) === activeFilter) &&
        (!triggerFilter || (triggerFilter === 'NONE' ? coupon.autoTrigger === null :coupon.autoTrigger === triggerFilter))
    );

    return (
        <>
            {/* 篩選列 */}
                <div className="mb-4 flex flex-wrap gap-3">
                <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜尋折扣碼或名稱"
                className={`w-[220px] max-[760px]:w-full ${filterClass}`}/>
                <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className={filterClass}>
                    <option value="">全部狀態</option>
                    <option value="true">啟用中</option>
                    <option value="false">已停用</option>
                </select>
                <select value={triggerFilter} onChange={(e) => setTriggerFilter(e.target.value)} className={filterClass}>
                    <option value="">全部發送方式</option>
                    <option value="NONE">不自動發送</option>
                    {COUPON_TRIGGERS.map(trigger => (
                        <option key={trigger.key} value={trigger.key}>{trigger.name}</option>
                    ))}
            </select>
            </div>

            {/* 寬度不夠時表格自己橫向捲動，不會撐破整頁 */}
            <div className="overflow-x-auto border border-line bg-white">
                <table className="w-full min-w-[960px] text-left text-[13px]">
                    <thead className="border-b border-line bg-cream text-[11px] tracking-[.1em] text-muted">
                        <tr>
                            <th className="px-4 py-3 font-medium">折扣碼</th>
                            <th className="px-4 py-3 font-medium">名稱</th>
                            <th className="px-4 py-3 font-medium">折扣</th>
                            <th className="px-4 py-3 font-medium">最低消費</th>
                            <th className="px-4 py-3 font-medium">有效天數</th>
                            <th className="px-4 py-3 font-medium">自動發送</th>
                            <th className="px-4 py-3 font-medium">狀態</th>
                            <th className="px-4 py-3 text-right font-medium">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCoupons.map(coupon => (
                            <tr key={coupon.id}
                                className={'border-b border-line last:border-b-0' + (coupon.active ? '' : ' text-muted')}>
                                <td className="px-4 py-3 font-medium tracking-[.04em]">{coupon.code}</td>
                                <td className="px-4 py-3">{coupon.title}</td>
                                <td className="px-4 py-3">{discountText(coupon)}</td>
                                <td className="px-4 py-3">{money(coupon.minSubtotal)}</td>
                                <td className="px-4 py-3">{coupon.validDays} 天</td>
                                <td className="px-4 py-3">
                                    {coupon.autoTrigger
                                        ? COUPON_TRIGGERS.find(trigger => trigger.key === coupon.autoTrigger)?.name
                                        : <span className="text-stone">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                    {coupon.active
                                        ? <span className="text-[#2f6b3a]">● 啟用中</span>
                                        : <span className="text-[#b0413e]">● 已停用</span>}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <button type="button" onClick={() => onEdit(coupon)} className={smallButtonClass}>編輯</button>
                                    <button type="button" onClick={() => onToggleActive(coupon)}
                                            className={`${smallButtonClass} ${coupon.active
                                                ? 'hover:border-[#b0413e] hover:text-[#b0413e]'
                                                : 'text-[#111] hover:border-[#2f6b3a] hover:text-[#2f6b3a]'}`}>
                                        {coupon.active ? '停用' : '啟用'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredCoupons.length === 0 && (
                <p className="py-10 text-center text-[13px] text-muted">沒有符合條件的折價券</p>
            )}
        </>
    )
}

export default CouponTable;
