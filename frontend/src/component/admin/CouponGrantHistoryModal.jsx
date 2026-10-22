import { useEffect, useState } from "react";
import { adminApi, fmtDateTime } from "../../js/admin.js";

/**
 * 查看一張折價券的實際發放紀錄。
 *
 * 每一列都是一張已發給會員的 MemberCoupon，
 * 可追查會員、領取時間、到期日與使用訂單。
 */
function CouponGrantHistoryModal({ coupon, onClose }) {
    const [page, setPage] = useState(0);
    const [grantPage, setGrantPage] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setGrantPage(null);
        setError("");

        adminApi(`/api/admin/mkt/coupons/${coupon.id}/grants?page=${page}&size=20`)
            .then(setGrantPage)
            .catch(e => setError(e.message));
    }, [coupon.id, page]);

    const grants = grantPage?.content ?? [];
    const totalPages = grantPage?.page?.totalPages ?? 0;
    const totalElements = grantPage?.page?.totalElements ?? 0;

    function usageText(grant) {
        if (grant.usedAt) {
            return grant.orderNo
                ? `已使用・${grant.orderNo}`
                : "已使用";
        }
        return "尚未使用";
    }

    function usageClass(grant) {
        return grant.usedAt
            ? "border-[#bad4c7] bg-[#f3faf6] text-[#32654b]"
            : "border-[#ead9a4] bg-[#fffdf3] text-[#856400]";
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="折價券發放紀錄"
            onClick={onClose}
        >
            <div
                className="flex max-h-full w-full max-w-[980px] flex-col border border-line bg-paper"
                onClick={event => event.stopPropagation()}
            >
                <header className="flex items-start justify-between border-b border-line bg-white px-6 py-4 max-[600px]:px-4">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">COUPON GRANT HISTORY</div>
                        <h2 className="mt-1 text-[20px] font-medium tracking-[.06em]">
                            {coupon.code} 發放紀錄
                        </h2>
                        <p className="mt-1 text-[11px] text-muted">{coupon.title}</p>
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

                <div className="min-h-0 overflow-y-auto p-6 max-[600px]:p-4">
                    <div className="mb-3 text-[12px] tracking-[.06em] text-muted">
                        {grantPage ? `共 ${totalElements} 筆發放紀錄` : "載入中…"}
                    </div>

                    {error && (
                        <p className="border border-[#b0413e] bg-[#fff5f3] px-3 py-2.5 text-[12px] text-[#9a3f30]">
                            {error}
                        </p>
                    )}

                    <div className="overflow-x-auto border border-line bg-white max-[700px]:hidden">
                        <table className="w-full min-w-[780px] border-collapse text-left">
                            <thead className="border-b border-line bg-paper text-[11px] tracking-[.08em] text-muted">
                            <tr>
                                <th className="px-4 py-3 font-medium">會員</th>
                                <th className="px-4 py-3 font-medium">領取時間</th>
                                <th className="px-4 py-3 font-medium">到期時間</th>
                                <th className="px-4 py-3 text-center font-medium">使用狀態</th>
                            </tr>
                            </thead>
                            <tbody>
                            {grants.map(grant => (
                                <tr key={grant.memberCouponId} className="border-b border-line last:border-b-0">
                                    <td className="px-4 py-4">
                                        <div className="text-[13px]">{grant.memberName}</div>
                                        <div className="mt-1 break-all text-[11px] text-muted">
                                            {grant.memberEmail}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-[12px]">
                                        {fmtDateTime(grant.receivedAt)}
                                    </td>
                                    <td className="px-4 py-4 text-[12px]">
                                        {fmtDateTime(grant.expireAt)}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                            <span className={`inline-block border px-2.5 py-1 text-[11px] ${usageClass(grant)}`}>
                                                {usageText(grant)}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="hidden flex-col gap-3 max-[700px]:flex">
                        {grants.map(grant => (
                            <article key={grant.memberCouponId} className="border border-line bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[13px]">{grant.memberName}</div>
                                        <div className="mt-1 break-all text-[11px] text-muted">
                                            {grant.memberEmail}
                                        </div>
                                    </div>
                                    <span className={`shrink-0 border px-2.5 py-1 text-[11px] ${usageClass(grant)}`}>
                                        {usageText(grant)}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[12px]">
                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">領取時間</div>
                                        <div className="mt-1">{fmtDateTime(grant.receivedAt)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">到期時間</div>
                                        <div className="mt-1">{fmtDateTime(grant.expireAt)}</div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {grantPage && grants.length === 0 && (
                        <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                            這張折價券尚未發送給任何會員
                        </p>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                disabled={page === 0}
                                onClick={() => setPage(current => current - 1)}
                                className="border border-line bg-white px-3 py-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                上一頁
                            </button>

                            <span className="text-[11px] text-muted">
                                {page + 1} / {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={page === totalPages - 1}
                                onClick={() => setPage(current => current + 1)}
                                className="border border-line bg-white px-3 py-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                下一頁
                            </button>
                        </div>
                    )}
                </div>

                <footer className="border-t border-line bg-white px-6 py-4 text-right max-[600px]:px-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="border border-line bg-white px-5 py-2.5 text-[12px] hover:border-black"
                    >
                        關閉
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default CouponGrantHistoryModal;