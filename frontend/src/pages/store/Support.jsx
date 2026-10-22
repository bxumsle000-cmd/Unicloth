import { useEffect, useState } from "react";
import { api, toast } from "../../js/kinu.js";

const TOPICS = [
    "訂單與物流",
    "退換貨",
    "商品諮詢",
    "付款與發票",
    "折價券與活動",
    "會員帳號問題",
    "其他",
];

const TICKET_STATUS_LABELS = {
    IN_PROGRESS: "處理中",
    RESOLVED: "已解決",
};

function formatDateTime(value) {
    return value
        ? String(value).slice(0, 16).replace("T", " ").replace(/-/g, "/")
        : "—";
}

function statusClass(status) {
    if (status === "RESOLVED") {
        return "border-[#bad4c7] bg-[#f3faf6] text-[#32654b]";
    }

    return "border-[#ead9a4] bg-[#fffdf3] text-[#856400]";
}

/**
 * 前台客服中心。
 *
 * 會員可建立客服單，也能查看自己過去提出的問題、
 * 客服回覆與案件結案狀態。
 */
function Support() {
    const [form, setForm] = useState({
        email: "",
        topic: TOPICS[0],
        message: "",
    });
    const [tickets, setTickets] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdTicket, setCreatedTicket] = useState(null);

    useEffect(() => {
        // 只取得目前登入會員的案件，後端會依會員 token 自動限制資料範圍。
        api("/api/support-tickets")
            .then(setTickets)
            .catch(error => toast(error.message, true));
    }, []);

    function updateForm(field, value) {
        setForm(current => ({
            ...current,
            [field]: value,
        }));
    }

    /**
     * 將會員填寫的內容送至既有的 POST /api/support-tickets。
     * 成功後立即加入「我的客服單」清單，避免需要重新整理網頁。
     */
    async function submitTicket(event) {
        event.preventDefault();

        if (!form.email.trim()) {
            toast("請填寫聯絡 Email", true);
            return;
        }

        if (!form.message.trim()) {
            toast("請填寫問題內容", true);
            return;
        }

        setIsSubmitting(true);

        try {
            const ticket = await api("/api/support-tickets", {
                method: "POST",
                body: {
                    email: form.email.trim(),
                    topic: form.topic,
                    message: form.message.trim(),
                },
            });

            setCreatedTicket(ticket);
            setTickets(current => [ticket, ...(current ?? [])]);
        } catch (error) {
            toast(error.message, true);
        } finally {
            setIsSubmitting(false);
        }
    }

    function createAnotherTicket() {
        setCreatedTicket(null);
        setForm(current => ({
            ...current,
            message: "",
        }));
    }

    return (
        <div className="mx-auto w-full max-w-[760px] px-5 py-12 font-kinu text-[#111] max-[600px]:py-8">
            <div className="mb-8">
                <div className="text-[10px] tracking-[.22em] text-muted">CUSTOMER SUPPORT</div>
                <h1 className="mt-1 text-[28px] font-medium tracking-[.08em]">客服中心</h1>
                <p className="mt-3 text-[13px] leading-[1.8] text-muted">
                    有訂單、商品或帳號相關問題嗎？留下資料後，客服人員會處理你的案件。
                </p>
            </div>

            {createdTicket ? (
                <section className="border border-line bg-white p-7 text-center max-[600px]:p-5">
                    <div className="text-[10px] tracking-[.2em] text-muted">TICKET CREATED</div>
                    <h2 className="mt-3 text-[20px] font-medium tracking-[.08em]">客服單已送出</h2>
                    <p className="mt-3 text-[13px] leading-[1.8] text-muted">
                        你的客服單號是
                    </p>
                    <p className="mt-2 text-[18px] tracking-[.12em]">{createdTicket.ticketNo}</p>
                    <p className="mt-5 text-[12px] leading-[1.8] text-muted">
                        客服人員會依案件內容處理；回覆與處理狀態會顯示在下方「我的客服單」。
                    </p>

                    <button
                        type="button"
                        onClick={createAnotherTicket}
                        className="mt-6 border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80"
                    >
                        再建立一張客服單
                    </button>
                </section>
            ) : (
                <form onSubmit={submitTicket} className="border border-line bg-white p-7 max-[600px]:p-5">
                    <div className="grid gap-5">
                        <label className="block">
                            <span className="text-[12px]">聯絡 Email</span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={event => updateForm("email", event.target.value)}
                                placeholder="name@example.com"
                                maxLength="255"
                                className="mt-2 w-full border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                            />
                        </label>

                        <label className="block">
                            <span className="text-[12px]">問題類型</span>
                            <select
                                value={form.topic}
                                onChange={event => updateForm("topic", event.target.value)}
                                className="mt-2 w-full border border-line bg-paper px-3 py-2.5 text-[13px] outline-none focus:border-black"
                            >
                                {TOPICS.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-[12px]">問題內容</span>
                            <textarea
                                value={form.message}
                                onChange={event => updateForm("message", event.target.value)}
                                placeholder="請盡量描述訂單編號、商品名稱或遇到的情況"
                                maxLength="2000"
                                rows="8"
                                className="mt-2 w-full resize-y border border-line bg-paper px-3 py-3 text-[13px] leading-[1.7] outline-none focus:border-black"
                            />
                            <span className="mt-1 block text-right text-[10px] text-muted">
                                {form.message.length} / 2000
                            </span>
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="border border-black bg-black px-5 py-2.5 text-[12px] tracking-[.08em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isSubmitting ? "送出中…" : "送出客服單"}
                        </button>
                    </div>
                </form>
            )}

            {/* 會員只能看到自己的客服單，不能看其他會員的資料。 */}
            <section className="mt-10">
                <div className="mb-4">
                    <div className="text-[10px] tracking-[.2em] text-muted">MY SUPPORT TICKETS</div>
                    <h2 className="mt-1 text-[20px] font-medium tracking-[.08em]">我的客服單</h2>
                </div>

                {!tickets && (
                    <p className="border border-line bg-white py-8 text-center text-[13px] text-muted">
                        客服單載入中……
                    </p>
                )}

                {tickets?.length === 0 && (
                    <p className="border border-line bg-white py-8 text-center text-[13px] text-muted">
                        目前沒有客服單
                    </p>
                )}

                <div className="grid gap-4">
                    {tickets?.map(ticket => (
                        <article key={ticket.ticketNo} className="border border-line bg-white p-5 max-[600px]:p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="text-[13px] tracking-[.06em]">{ticket.ticketNo}</div>
                                    <div className="mt-1 text-[11px] text-muted">
                                        建立於 {formatDateTime(ticket.createdAt)}
                                    </div>
                                </div>

                                <span className={`border px-2.5 py-1 text-[11px] tracking-[.06em] ${statusClass(ticket.status)}`}>
                                    {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
                                </span>
                            </div>

                            <div className="mt-4 border-t border-line pt-4">
                                <div className="text-[10px] tracking-[.08em] text-muted">問題類型</div>
                                <p className="mt-1 text-[13px]">{ticket.topic}</p>

                                <div className="mt-4 text-[10px] tracking-[.08em] text-muted">我的問題</div>
                                <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-[1.8]">
                                    {ticket.message}
                                </p>
                            </div>

                            <div className="mt-4 border-t border-line pt-4">
                                <div className="text-[10px] tracking-[.08em] text-muted">客服回覆</div>
                                {ticket.reply ? (
                                    <>
                                        <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-[1.8]">
                                            {ticket.reply}
                                        </p>
                                        <p className="mt-2 text-[11px] text-muted">
                                            回覆於 {formatDateTime(ticket.repliedAt)}
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-1 text-[13px] text-muted">
                                        客服尚未回覆，請稍候。
                                    </p>
                                )}
                            </div>

                            {ticket.resolvedAt && (
                                <p className="mt-4 text-[11px] text-muted">
                                    結案於 {formatDateTime(ticket.resolvedAt)}
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Support;