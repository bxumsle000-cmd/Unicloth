import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_TOKEN_KEY, adminApi, fmtDateTime } from "../../js/admin.js";
import { toast } from "../../js/kinu.js";
import Pagination from "../../component/product/Pagination.jsx";
import AdminHeader from "../../component/admin/AdminHeader.jsx";
import CsTicketDetailModal from "../../component/admin/CsTicketDetailModal.jsx";

const filterClass = "border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black";

const TICKET_STATUS_LABELS = {
    IN_PROGRESS: "處理中",
    RESOLVED: "已解決",
};

function statusClass(status) {
    if (status === "RESOLVED") {
        return "border-[#bad4c7] bg-[#f3faf6] text-[#32654b]";
    }

    return "border-[#ead9a4] bg-[#fffdf3] text-[#856400]";
}

// 客服首頁（/admin/cs）：客服單查詢、回覆與結案。
function CsHome() {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(0);
    const [ticketPage, setTicketPage] = useState(null);

    // null 代表沒有開啟任何客服單詳細視窗。
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
            navigate("/admin/login");
        }
    }, [navigate]);

    useEffect(() => {
        const params = new URLSearchParams({
            page: String(page),
            size: "20",
        });

        if (keyword) params.set("keyword", keyword);
        if (status) params.set("status", status);

        adminApi(`/api/admin/cs/tickets?${params}`)
            .then(setTicketPage)
            .catch(error => toast(error.message, true));
    }, [keyword, status, page]);

    function search() {
        setKeyword(searchText.trim());
        setPage(0);
    }

    /**
     * 詳細視窗儲存回覆或結案後，只替換清單中的那一筆。
     * 因此不必重新查詢整頁客服單，畫面也會立即顯示新狀態。
     */
    function handleTicketUpdated(updatedTicket) {
        setTicketPage(currentPage => {
            if (!currentPage) return currentPage;

            return {
                ...currentPage,
                content: currentPage.content.map(ticket =>
                    ticket.id === updatedTicket.id
                        ? { ...ticket, ...updatedTicket }
                        : ticket
                ),
            };
        });
    }

    const tickets = ticketPage?.content ?? [];

    return (
        <div className="flex min-h-screen bg-paper font-kinu text-[#111] max-[760px]:flex-col">
            <aside className="w-[220px] shrink-0 border-r border-line bg-white max-[760px]:w-full max-[760px]:border-r-0 max-[760px]:border-b">
                <div className="mt-1 px-6 py-6 text-[16px] font-medium tracking-[.08em] max-[760px]:py-4">
                    客服
                </div>

                <nav className="flex flex-col pb-6 max-[760px]:flex-row max-[760px]:pb-0">
                    <div className="border-l-2 border-black bg-paper px-6 py-3 text-[13px] font-medium tracking-[.08em] max-[760px]:border-l-0 max-[760px]:border-b-2 max-[760px]:px-4">
                        客服單
                    </div>
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <AdminHeader />

                <main className="flex-1 px-8 py-8 max-[760px]:px-4">
                    <div className="mb-6">
                        <div className="text-[10px] tracking-[.22em] text-muted">CUSTOMER SERVICE</div>
                        <h1 className="text-[24px] font-medium tracking-[.08em]">客服單</h1>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-3">
                        <input
                            type="text"
                            value={searchText}
                            placeholder="客服單號、Email、問題類型、問題內容"
                            onChange={event => setSearchText(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === "Enter") search();
                            }}
                            className={`${filterClass} w-[290px] max-[760px]:w-full`}
                        />

                        <button
                            type="button"
                            onClick={search}
                            className="border border-black bg-black px-4 py-2 text-[12px] tracking-[.1em] text-white hover:opacity-80"
                        >
                            搜尋
                        </button>

                        <select
                            value={status}
                            onChange={event => {
                                setStatus(event.target.value);
                                setPage(0);
                            }}
                            className={filterClass}
                        >
                            <option value="">全部狀態</option>
                            {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3 text-[12px] tracking-[.06em] text-muted">
                        {ticketPage ? `共 ${ticketPage.page?.totalElements ?? 0} 筆客服單` : "載入中…"}
                    </div>

                    {/* 桌面版表格：保留完整欄位，螢幕不足 760px 時改用下方卡片。 */}
                    <div className="overflow-x-auto border border-line bg-white max-[760px]:hidden">
                        <table className="w-full min-w-[900px] border-collapse text-left">
                            <thead className="border-b border-line bg-paper text-[11px] tracking-[.08em] text-muted">
                            <tr>
                                <th className="px-4 py-3 font-medium">客服單號／時間</th>
                                <th className="px-4 py-3 font-medium">聯絡 Email</th>
                                <th className="px-4 py-3 font-medium">問題類型</th>
                                <th className="px-4 py-3 font-medium">最後回覆</th>
                                <th className="px-4 py-3 text-center font-medium">狀態</th>
                                <th className="px-4 py-3 text-center font-medium">詳細</th>
                            </tr>
                            </thead>

                            <tbody>
                            {tickets.map(ticket => (
                                <tr key={ticket.id} className="border-b border-line last:border-b-0 hover:bg-[#fcfbf8]">
                                    <td className="px-4 py-4">
                                        <div className="text-[13px] tracking-[.05em]">{ticket.ticketNo}</div>
                                        <div className="mt-1 text-[11px] text-muted">
                                            {fmtDateTime(ticket.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 break-all text-[12px]">{ticket.email}</td>
                                    <td className="px-4 py-4 text-[12px]">{ticket.topic}</td>
                                    <td className="px-4 py-4 text-[12px] text-muted">
                                        {fmtDateTime(ticket.repliedAt)}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                            <span className={`inline-block border px-2.5 py-1 text-[11px] tracking-[.06em] ${statusClass(ticket.status)}`}>
                                                {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
                                            </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTicketId(ticket.id)}
                                            className="border border-line bg-white px-3 py-1.5 text-[11px] tracking-[.06em] hover:border-black"
                                        >
                                            查看
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 手機版改用卡片，避免表格欄位被擠得無法閱讀。 */}
                    <div className="hidden flex-col gap-3 max-[760px]:flex">
                        {tickets.map(ticket => (
                            <article key={ticket.id} className="border border-line bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[13px] tracking-[.05em]">{ticket.ticketNo}</div>
                                        <div className="mt-1 text-[11px] text-muted">
                                            {fmtDateTime(ticket.createdAt)}
                                        </div>
                                    </div>

                                    <span className={`shrink-0 border px-2.5 py-1 text-[11px] tracking-[.06em] ${statusClass(ticket.status)}`}>
                                        {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[12px]">
                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">聯絡 Email</div>
                                        <div className="mt-1 break-all">{ticket.email}</div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] tracking-[.08em] text-muted">問題類型</div>
                                        <div className="mt-1">{ticket.topic}</div>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="text-[10px] tracking-[.08em] text-muted">最後回覆</div>
                                        <div className="mt-1">{fmtDateTime(ticket.repliedAt)}</div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className="mt-4 w-full border border-line bg-white px-3 py-2.5 text-[12px] tracking-[.08em] hover:border-black"
                                >
                                    查看客服單
                                </button>
                            </article>
                        ))}
                    </div>

                    {!ticketPage && (
                        <p className="py-10 text-center text-[13px] text-muted">載入中…</p>
                    )}

                    {ticketPage && tickets.length === 0 && (
                        <p className="border border-line bg-white py-10 text-center text-[13px] text-muted">
                            沒有符合條件的客服單
                        </p>
                    )}

                    <Pagination
                        page={page}
                        totalPages={ticketPage?.page?.totalPages}
                        setPage={setPage}
                    />
                </main>
            </div>

            {selectedTicketId && (
                <CsTicketDetailModal
                    ticketId={selectedTicketId}
                    onClose={() => setSelectedTicketId(null)}
                    onTicketUpdated={handleTicketUpdated}
                />
            )}
        </div>
    );
}

export default CsHome;