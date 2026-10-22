import { useState } from "react";
import { adminApi } from "../../js/admin.js";

/**
 * 指定發放折價券給會員的視窗。
 *
 * coupon 是目前選取的折價券；
 * 成功後保留視窗並清空 Email，可繼續發送給下一位會員。
 */
function CouponGrantModal({ coupon, onClose }) {
    const [memberEmail, setMemberEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSending, setIsSending] = useState(false);

    const discountText = coupon.type === "AMOUNT"
        ? `折抵 NT$ ${coupon.value}`
        : `折扣 ${coupon.value}%`;

    /**
     * 呼叫行銷後台 API，建立會員實際持有的一張 MemberCoupon。
     */
    async function submitGrant(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!memberEmail.trim()) {
            setError("請填寫會員 Email。");
            return;
        }

        setIsSending(true);

        try {
            await adminApi("/api/admin/mkt/coupons/grants", {
                method: "POST",
                body: {
                    memberEmail: memberEmail.trim(),
                    couponId: coupon.id,
                },
            });

            setSuccess(`已將「${coupon.code}」發送給 ${memberEmail.trim()}。`);
            setMemberEmail("");
        } catch (e) {
            setError(e.message);
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="指定發放折價券"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[560px] border border-line bg-paper"
                onClick={event => event.stopPropagation()}
            >
                <header className="flex items-start justify-between border-b border-line bg-white px-6 py-4 max-[600px]:px-4">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">GRANT COUPON</div>
                        <h2 className="mt-1 text-[20px] font-medium tracking-[.06em]">指定發券</h2>
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

                <form onSubmit={submitGrant} className="p-6 max-[600px]:p-4">
                    <section className="border border-line bg-white p-4">
                        <div className="text-[10px] tracking-[.16em] text-muted">SELECTED COUPON</div>
                        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                            <strong className="text-[16px] tracking-[.04em]">{coupon.code}</strong>
                            <span className="text-[12px]">{discountText}</span>
                        </div>
                        <p className="mt-1 text-[12px] text-muted">{coupon.title}</p>
                        <p className="mt-2 text-[11px] text-muted">
                            最低消費 NT$ {coupon.minSubtotal.toLocaleString()}・領取後 {coupon.validDays} 天有效
                        </p>
                    </section>

                    <label className="mt-5 block">
                        <span className="text-[11px] text-muted">會員 Email</span>
                        <input
                            type="email"
                            value={memberEmail}
                            onChange={event => setMemberEmail(event.target.value)}
                            placeholder="例如：member@example.com"
                            maxLength="255"
                            className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black"
                        />
                        <span className="mt-1 block text-[10px] text-muted">
                            系統會依此 Email 尋找會員帳號，並發放一張新的折價券。
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
                            disabled={isSending}
                            className="border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isSending ? "發送中…" : "發送折價券"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CouponGrantModal;