import { useState } from "react";
import { adminApi } from "../../js/admin.js";

/**
 * 行銷後台新增折價券視窗。
 *
 * 成功建立後保留視窗、清空表單，方便連續建立多張券；
 * 是否關閉由右上角 X 或右下角「關閉」按鈕決定。
 */
function CouponCreateModal({ onClose, onCreated }) {
    const initialForm = {
        code: "",
        title: "",
        type: "AMOUNT",
        value: "",
        minSubtotal: "0",
        validDays: "30",
        signupGift: false,
    };

    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    function updateForm(field, value) {
        setForm(current => ({
            ...current,
            [field]: value,
        }));
    }

    /**
     * 新增折價券範本，成功後將新資料交給清單頁立即顯示。
     */
    async function submitCoupon(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!form.code.trim() || !form.title.trim()) {
            setError("請填寫折扣碼與折價券名稱。");
            return;
        }

        setIsSaving(true);

        try {
            const createdCoupon = await adminApi("/api/admin/mkt/coupons", {
                method: "POST",
                body: {
                    code: form.code.trim(),
                    title: form.title.trim(),
                    type: form.type,
                    value: Number(form.value),
                    minSubtotal: Number(form.minSubtotal),
                    validDays: Number(form.validDays),
                    signupGift: form.signupGift,
                },
            });

            onCreated?.(createdCoupon);
            setSuccess(`已建立折價券：${createdCoupon.code}`);
            setForm(initialForm);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    }

    const valueLabel = form.type === "AMOUNT" ? "折抵金額" : "折扣百分比";
    const valuePlaceholder = form.type === "AMOUNT" ? "例如：100" : "例如：10（代表 9 折）";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="新增折價券"
            onClick={onClose}
        >
            <div
                className="max-h-full w-full max-w-[680px] overflow-y-auto border border-line bg-paper"
                onClick={event => event.stopPropagation()}
            >
                <header className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-white px-6 py-4 max-[600px]:px-4">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">CREATE COUPON</div>
                        <h2 className="mt-1 text-[20px] font-medium tracking-[.06em]">新增折價券</h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="關閉"
                        title="關閉"
                        className="flex h-9 w-9 items-center justify-center border border-line text-[24px] leading-none hover:border-black"
                    >
                        ×
                    </button>
                </header>

                <form onSubmit={submitCoupon} className="p-6 max-[600px]:p-4">
                    <div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
                        <label className="block">
                            <span className="text-[11px] text-muted">折扣碼</span>
                            <input
                                type="text"
                                value={form.code}
                                onChange={event => updateForm("code", event.target.value)}
                                placeholder="例如：SUMMER100"
                                maxLength="30"
                                className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-[13px] uppercase outline-none focus:border-black"
                            />
                            <span className="mt-1 block text-[10px] text-muted">
                                英文字母、數字、底線或連字號；儲存時會自動轉大寫。
                            </span>
                        </label>

                        <label className="block">
                            <span className="text-[11px] text-muted">折價券名稱</span>
                            <input
                                type="text"
                                value={form.title}
                                onChange={event => updateForm("title", event.target.value)}
                                placeholder="例如：夏季會員購物金"
                                maxLength="100"
                                className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black"
                            />
                        </label>

                        <label className="block">
                            <span className="text-[11px] text-muted">優惠類型</span>
                            <select
                                value={form.type}
                                onChange={event => updateForm("type", event.target.value)}
                                className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black"
                            >
                                <option value="AMOUNT">折抵金額</option>
                                <option value="PERCENT">折扣百分比</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-[11px] text-muted">{valueLabel}</span>
                            <input
                                type="number"
                                value={form.value}
                                onChange={event => updateForm("value", event.target.value)}
                                placeholder={valuePlaceholder}
                                min="1"
                                max={form.type === "PERCENT" ? "100" : undefined}
                                className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black"
                            />
                        </label>

                        <label className="block">
                            <span className="text-[11px] text-muted">最低消費金額</span>
                            <input
                                type="number"
                                value={form.minSubtotal}
                                onChange={event => updateForm("minSubtotal", event.target.value)}
                                min="0"
                                className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black"
                            />
                        </label>

                        <label className="block">
                            <span className="text-[11px] text-muted">領取後有效天數</span>
                            <input
                                type="number"
                                value={form.validDays}
                                onChange={event => updateForm("validDays", event.target.value)}
                                min="1"
                                className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black"
                            />
                        </label>
                    </div>

                    <label className="mt-5 flex cursor-pointer items-start gap-3 border border-line bg-white p-4">
                        <input
                            type="checkbox"
                            checked={form.signupGift}
                            onChange={event => updateForm("signupGift", event.target.checked)}
                            className="mt-0.5 accent-black"
                        />
                        <span>
                            <span className="block text-[13px]">註冊贈禮</span>
                            <span className="mt-1 block text-[11px] leading-[1.6] text-muted">
                                新會員完成註冊時，系統會自動發放這張折價券。
                            </span>
                        </span>
                    </label>

                    {error && (
                        <p className="mt-5 border border-[#b0413e] bg-[#fff5f3] px-3 py-2.5 text-[12px] text-[#9a3f30]">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="mt-5 border border-[#8bb89c] bg-[#f3faf6] px-3 py-2.5 text-[12px] text-[#32654b]">
                            {success}
                        </p>
                    )}

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="border border-line bg-white px-5 py-2.5 text-[12px] hover:border-black"
                        >
                            關閉
                        </button>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isSaving ? "儲存中…" : "建立折價券"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CouponCreateModal;