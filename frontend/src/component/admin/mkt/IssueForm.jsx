import { useEffect, useState } from "react";
import { adminApi, discountText } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import MemberPicker from "./MemberPicker.jsx";

const inputClass = "border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black";
const radioCardClass = "flex cursor-pointer items-center gap-2 border border-line px-3 py-2.5 text-[13px] has-[:checked]:border-black";

/** 現在時間轉成 datetime-local 輸入框的格式：2026-10-25T10:00（當作預約時間的下限） */
function nowForDateTimeInput() {
    const now = new Date();
    const pad = (number) => String(number).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** 發券表單：選券、發給誰（指定／全部會員）、立即或預約發送；發送或預約成功後呼叫 onIssued */
function IssueForm({ onIssued }) {
    // 啟用中的券（AdminCouponResponse），停用的不能發；null = 還沒載入完
    const [activeCouponList, setActiveCouponList] = useState(null);
    // 選的券 id（select 的值是字串）；'' = 沒有可以選的券
    const [couponId, setCouponId] = useState('');
    const [targetAll, setTargetAll] = useState(false);
    // MemberPicker 勾選的會員 id；送出時放進 memberIds
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isSchedule, setIsSchedule] = useState(false);
    // datetime-local 輸入框的值，例如 2026-10-25T10:00；'' = 還沒選
    const [scheduledAt, setScheduledAt] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        adminApi('/api/admin/mkt/coupons')
            .then((couponList) => {
                const activeCoupons = couponList.filter(coupon => coupon.active);
                setActiveCouponList(activeCoupons);
                // 預設選第一張
                setCouponId(activeCoupons.length > 0 ? String(activeCoupons[0].id) : '');
            })
            .catch((e) => toast(e.message, true));
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        const coupon = activeCouponList?.find(activeCoupon => String(activeCoupon.id) === couponId);
        if (!coupon) {
            toast('目前沒有券可以發', true);
            return;
        }
        if (!targetAll && selectedMemberIds.length === 0) {
            toast('請至少選一位會員', true);
            return;
        }
        if (isSchedule && !scheduledAt) {
            toast('請選擇預約時間', true);
            return;
        }

        // 預約時間要晚於現在、會員是否停用…後端會檢查，錯誤訊息直接顯示
        setLoading(true);
        try {
            await adminApi(`/api/admin/mkt/coupons/${coupon.id}/grant`, {
                method: 'POST',
                body: {
                    targetAll: targetAll,
                    memberIds: targetAll ? [] : selectedMemberIds,
                    scheduledAt: isSchedule ? scheduledAt : null,
                },
            });
            const targetText = targetAll ? '給全部會員' : `給 ${selectedMemberIds.length} 位會員`;
            toast(isSchedule
                ? `已預約 ${scheduledAt.replace('T', ' ')} 發送 ${coupon.code} ${targetText}`
                : `已發 ${coupon.code} ${targetText}`);
            setSelectedMemberIds([]);
            onIssued();
        } catch (e) {
            toast(e.message, true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate
              className="flex max-w-[560px] flex-col gap-5 border border-line bg-white px-7 py-7 max-[760px]:px-4">
            <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-[.12em] text-muted">要發哪張券</span>
                <select value={couponId} onChange={(e) => setCouponId(e.target.value)} className={inputClass}>
                    {activeCouponList?.length === 0 && <option value="">目前沒有啟用中的券</option>}
                    {activeCouponList?.map(coupon => (
                        <option key={coupon.id} value={coupon.id}>
                            {coupon.code}｜{coupon.title}（{discountText(coupon)}，{coupon.validDays} 天）
                        </option>
                    ))}
                </select>
            </label>

            <div className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-[.12em] text-muted">發給誰</span>
                <div className="grid grid-cols-2 gap-2">
                    <label className={radioCardClass}>
                        <input type="radio" checked={!targetAll} onChange={() => setTargetAll(false)} className="accent-black"/>指定會員
                    </label>
                    <label className={radioCardClass}>
                        <input type="radio" checked={targetAll} onChange={() => setTargetAll(true)} className="accent-black"/>全部會員
                    </label>
                </div>
            </div>

            {!targetAll && (
                <MemberPicker selectedMemberIds={selectedMemberIds} onChangeSelected={setSelectedMemberIds}/>
            )}

            <div className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-[.12em] text-muted">什麼時候發</span>
                <div className="grid grid-cols-2 gap-2">
                    <label className={radioCardClass}>
                        <input type="radio" checked={!isSchedule} onChange={() => setIsSchedule(false)} className="accent-black"/>立即發送
                    </label>
                    <label className={radioCardClass}>
                        <input type="radio" checked={isSchedule} onChange={() => setIsSchedule(true)} className="accent-black"/>預約發送
                    </label>
                </div>
            </div>

            {isSchedule && (
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">預約時間</span>
                    <input type="datetime-local" value={scheduledAt} min={nowForDateTimeInput()}
                           onChange={(e) => setScheduledAt(e.target.value)} className={inputClass}/>
                    <span className="text-[11px] text-muted">時間到才發；選「全部會員」的話，以發送當下的會員為準。</span>
                </label>
            )}

            <div className="flex justify-end">
                <button type="submit" disabled={loading}
                        className="border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.12em] text-white hover:opacity-80 disabled:opacity-50">
                    {isSchedule ? '建立預約' : '立即發券'}
                </button>
            </div>
        </form>
    )
}

export default IssueForm;
