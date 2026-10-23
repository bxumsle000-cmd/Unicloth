import { useEffect, useState } from "react";
import { adminApi, fmtDateTime } from "../../../js/admin.js";

const TICKET_STATUS_LABELS = {
    IN_PROGRESS: "處理中",
    RESOLVED: "已解決",
};

/** 顯示客服單的欄位名稱與內容。 */
function InfoItem({ label, children, className = "" }) {
    return (
        <div className={className}>
            <div className="text-[10px] tracking-[.08em] text-muted">{label}</div>
            <div className="mt-1 break-words text-[13px] leading-[1.6]">{children || "—"}</div>
        </div>
    );
}

/**
 * 客服單詳細視窗。
 *
 * 只有點選單筆客服單時才取得問題全文，
 * 並讓客服可選擇「儲存回覆」或「儲存回覆並結案」。
 */
function CsTicketDetailModal({ ticketId, onClose, onTicketUpdated }) {
    const [ticket, setTicket] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [error, setError] = useState("");
    const [replyError, setReplyError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let active = true;

        adminApi(`/api/admin/cs/tickets/${ticketId}`)
            .then(data => {
                if (!active) return;

                setTicket(data);
                // 已回覆過的案件先帶入原內容，讓客服能補充或修正。
                setReplyText(data.reply ?? "");
            })
            .catch(e => {
                if (active) setError(e.message);
            });

        return () => {
            active = false;
        };
    }, [ticketId]);

    /**
     * 儲存客服回覆。
     *
     * resolve 為 true 時直接結案；
     * false 則案件維持處理中，或將已結案案件重新開啟。
     */
    async function saveReply(resolve) {
        setReplyError("");

        if (!replyText.trim()) {
            setReplyError("請填寫回覆內容。");
            return;
        }

        setIsSaving(true);

        try {
            const updatedTicket = await adminApi(
                `/api/admin/cs/tickets/${ticketId}/reply`,
                {
                    method: "PATCH",
                    body: {
                        reply: replyText.trim(),
                        resolve,
                    },
                }
            );

            setTicket(updatedTicket);
            setReplyText(updatedTicket.reply ?? "");
            // 通知客服單清單同步更新狀態與回覆時間。
            onTicketUpdated?.(updatedTicket);
        } catch (e) {
            setReplyError(e.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="客服單詳細資料"
            onClick={onClose}
        >
            <div
                className="max-h-full w-full max-w-[820px] overflow-y-auto border border-line bg-paper"
                onClick={event => event.stopPropagation()}
            >
                <header className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-white px-6 py-4 max-[600px]:px-4">
                    <div>
                        <div className="text-[10px] tracking-[.2em] text-muted">CUSTOMER SERVICE</div>
                        <h2 className="mt-1 text-[20px] font-medium tracking-[.06em]">
                            客服單詳細資料
                        </h2>
                        {ticket && (
                            <p className="mt-1 text-[11px] text-muted">{ticket.ticketNo}</p>
                        )}
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

                {!ticket && !error && (
                    <p className="px-6 py-12 text-center text-[13px] text-muted">
                        客服單資料載入中……
                    </p>
                )}

                {error && (
                    <div className="p-6 max-[600px]:p-4">
                        <p className="border border-[#b0413e] bg-white px-4 py-3 text-[13px] text-[#b0413e]">
                            {error}
                        </p>
                    </div>
                )}

                {ticket && (
                    <div className="p-6 max-[600px]:p-4">
                        {/* 客服單基本資料與處理時間 */}
                        <section className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-[14px] font-medium tracking-[.1em]">案件資訊</h3>
                                    <p className="mt-1 text-[11px] text-muted">
                                        建立於 {fmtDateTime(ticket.createdAt)}
                                    </p>
                                </div>

                                <span className="border border-line bg-paper px-3 py-1.5 text-[11px] tracking-[.08em]">
                                    {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 max-[600px]:grid-cols-1">
                                <InfoItem label="客服單號">{ticket.ticketNo}</InfoItem>
                                <InfoItem label="聯絡 Email">{ticket.email}</InfoItem>
                                <InfoItem label="問題類型">{ticket.topic}</InfoItem>
                                <InfoItem label="最後回覆時間">
                                    {fmtDateTime(ticket.repliedAt)}
                                </InfoItem>
                                <InfoItem label="結案時間">
                                    {fmtDateTime(ticket.resolvedAt)}
                                </InfoItem>
                            </div>
                        </section>

                        {/* 會員原始提問，保留換行讓客服能完整閱讀。 */}
                        <section className="mb-5 border border-line bg-white p-5 max-[600px]:p-4">
                            <h3 className="mb-3 text-[14px] font-medium tracking-[.1em]">會員問題</h3>
                            <p className="whitespace-pre-wrap break-words border border-line bg-paper p-4 text-[13px] leading-[1.8]">
                                {ticket.message}
                            </p>
                        </section>

                        {/* 回覆可以儲存為處理中，或與結案動作一起儲存。 */}
                        <section className="border border-line bg-white p-5 max-[600px]:p-4">
                            <div className="mb-3">
                                <h3 className="text-[14px] font-medium tracking-[.1em]">客服回覆</h3>
                                <p className="mt-1 text-[11px] text-muted">
                                    回覆會儲存在客服單中；此版本不會自動寄送 Email。
                                </p>
                            </div>

                            <textarea
                                value={replyText}
                                onChange={event => setReplyText(event.target.value)}
                                maxLength="2000"
                                rows="8"
                                placeholder="請輸入提供給會員的回覆內容"
                                className="w-full resize-y border border-line bg-paper px-3 py-3 text-[13px] leading-[1.7] outline-none focus:border-black"
                            />

                            <div className="mt-1 text-right text-[10px] text-muted">
                                {replyText.length} / 2000
                            </div>

                            {replyError && (
                                <p className="mt-3 border border-[#b0413e] bg-[#fff5f3] px-3 py-2 text-[12px] text-[#9a3f30]">
                                    {replyError}
                                </p>
                            )}

                            <div className="mt-4 flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => saveReply(false)}
                                    disabled={isSaving}
                                    className="border border-line bg-white px-4 py-2.5 text-[12px] tracking-[.06em] hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isSaving
                                        ? "儲存中…"
                                        : ticket.status === "RESOLVED"
                                            ? "儲存並重新開啟"
                                            : "儲存回覆"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => saveReply(true)}
                                    disabled={isSaving}
                                    className="border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.06em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isSaving ? "儲存中…" : "儲存並結案"}
                                </button>
                            </div>
                        </section>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="border border-line bg-white px-5 py-2.5 text-[12px] hover:border-black"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CsTicketDetailModal;