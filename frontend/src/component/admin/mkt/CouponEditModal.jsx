import { useState } from "react";
import { COUPON_TRIGGERS, adminApi } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import Modal from "../shared/Modal.jsx";

const inputClass = "border border-line bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-black disabled:text-muted";
const blackButtonClass = "border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.12em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";
const lineButtonClass = "border border-line px-4 py-2.5 text-[12px] tracking-[.12em] hover:border-black";

const COUPON_TYPES = [
    { key: 'AMOUNT',  name: '折固定金額' },
    { key: 'PERCENT', name: '打折（%）' },
];

/**
 * 編輯折價券：欄位跟新增一樣，但折扣碼不能改<br>
 * coupon 是被點的那張券（AdminCouponResponse）；已經發出去的券顯示修改警告
 */
function CouponEditModal({ coupon, onClose, reload }) {
    const [title, setTitle] = useState(coupon.title);
    const [type, setType] = useState(coupon.type);
    // 數字欄位先存輸入框的字串，送出時再轉數字；'' = 被清空
    const [discountValue, setDiscountValue] = useState(String(coupon.value));
    const [minSubtotal, setMinSubtotal] = useState(String(coupon.minSubtotal));
    const [validDays, setValidDays] = useState(String(coupon.validDays));
    const [autoTrigger, setAutoTrigger] = useState(coupon.autoTrigger ?? ''); // '' = 不自動發送
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        if (!title.trim()) {
            toast('請填寫名稱', true);
            return;
        }

        // 其他規則（折扣大於 0、打折 % 上限、折的金額要比最低消費小…）後端會檢查，錯誤訊息直接顯示
        // 折扣碼建立後不能改，所以不用送
        setLoading(true);
        try {
            await adminApi(`/api/admin/mkt/coupons/${coupon.id}`, {
                method: 'PUT',
                body: {
                    title: title.trim(),
                    type: type,
                    value: discountValue === '' ? null : Number(discountValue),
                    minSubtotal: minSubtotal === '' ? null : Number(minSubtotal),
                    validDays: validDays === '' ? null : Number(validDays),
                    autoTrigger: autoTrigger || null,
                },
            });
            toast(`已更新 ${coupon.code}`);
            reload();
            onClose();
        } catch (e) {
            toast(e.message, true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal title="編輯折價券" onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">折扣碼（建立後不能改）</span>
                    <input type="text" value={coupon.code} disabled className={inputClass}/>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">名稱</span>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass}/>
                </label>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">折扣方式</span>
                    <div className="grid grid-cols-2 gap-2">
                        {COUPON_TYPES.map(couponType => (
                            <button key={couponType.key} type="button" onClick={() => setType(couponType.key)}
                                    className={'border px-2 py-2 text-[12px] tracking-[.08em] transition-colors '
                                        + (couponType.key === type
                                            ? 'border-black bg-black text-white'
                                            : 'border-line bg-white hover:border-black')}>
                                {couponType.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] tracking-[.12em] text-muted">{type === 'AMOUNT' ? '折多少元' : '折幾 %'}</span>
                        <input type="number" min="1" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                               className={`min-w-0 ${inputClass}`}/>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] tracking-[.12em] text-muted">最低消費</span>
                        <input type="number" min="0" value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)}
                               className={`min-w-0 ${inputClass}`}/>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] tracking-[.12em] text-muted">有效天數</span>
                        <input type="number" min="1" value={validDays} onChange={(e) => setValidDays(e.target.value)}
                               className={`min-w-0 ${inputClass}`}/>
                    </label>
                </div>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[.12em] text-muted">自動發送</span>
                    <select value={autoTrigger} onChange={(e) => setAutoTrigger(e.target.value)} className={inputClass}>
                        <option value="">不自動發送（只能手動發）</option>
                        {COUPON_TRIGGERS.map(trigger => (
                            <option key={trigger.key} value={trigger.key}>{trigger.name}</option>
                        ))}
                    </select>
                </label>
                {coupon.issuedCount > 0 && (
                    <p className="border border-line bg-cream px-3 py-2 text-[12px] text-muted">
                        這張券已經發出 {coupon.issuedCount} 張。修改折扣內容，已發出、還沒用的券也會跟著變。
                    </p>
                )}
                <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={lineButtonClass}>取消</button>
                    <button type="submit" disabled={loading} className={blackButtonClass}>{loading ? '儲存中…' : '儲存'}</button>
                </div>
            </form>
        </Modal>
    )
}

export default CouponEditModal;
