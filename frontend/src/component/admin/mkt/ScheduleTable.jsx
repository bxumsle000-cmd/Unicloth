import { MdRefresh } from "react-icons/md";
import { COUPON_SCHEDULE_STATUSES, fmtDateTime } from "../../../js/admin.js";
import Pagination from "../../common/Pagination.jsx";

const filterClass = "border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black";

/**
 * 預約發送表格：依狀態篩選、換頁，等待中的可以取消預約<br>
 * schedulePage 是後端回的分頁物件（content = 這一頁的 CouponScheduleResponse）；
 * 篩選和分頁都在後端做，這裡只把選的值交給 IssuePage（onChangeStatusFilter、setPage）<br>
 * 排程發送後畫面不會自己更新，按「重新整理」呼叫 onReload 重查
 */
function ScheduleTable({ schedulePage, statusFilter, onChangeStatusFilter, page, setPage, onCancel, onReload }) {
    const scheduleList = schedulePage.content;

    return (
        <div className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-[16px] font-medium tracking-[.08em]">預約發送紀錄</h2>
                <div className="flex gap-3">
                    <select value={statusFilter} onChange={(e) => onChangeStatusFilter(e.target.value)} className={filterClass}>
                        <option value="">全部狀態</option>
                        {COUPON_SCHEDULE_STATUSES.map(status => (
                            <option key={status.key} value={status.key}>{status.name}</option>
                        ))}
                    </select>
                    <button type="button" onClick={onReload} aria-label="重新整理" title="重新整理"
                            className="flex w-[38px] items-center justify-center border border-line bg-white hover:border-black">
                        <MdRefresh className="text-[18px]"/>
                    </button>
                </div>
            </div>

            {/* 寬度不夠時表格自己橫向捲動，不會撐破整頁 */}
            <div className="overflow-x-auto border border-line bg-white">
                <table className="w-full min-w-[880px] text-left text-[13px]">
                    <thead className="border-b border-line bg-cream text-[11px] tracking-[.1em] text-muted">
                        <tr>
                            <th className="px-4 py-3 font-medium">預約時間</th>
                            <th className="px-4 py-3 font-medium">折價券</th>
                            <th className="px-4 py-3 font-medium">發給</th>
                            <th className="px-4 py-3 font-medium">狀態</th>
                            <th className="px-4 py-3 font-medium">實際發送</th>
                            <th className="px-4 py-3 font-medium">建立者</th>
                            <th className="px-4 py-3 text-right font-medium">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scheduleList.map(schedule => {
                            const status = COUPON_SCHEDULE_STATUSES.find(scheduleStatus => scheduleStatus.key === schedule.status);
                            return (
                                <tr key={schedule.id} className="border-b border-line last:border-b-0">
                                    <td className="whitespace-nowrap px-4 py-3">{fmtDateTime(schedule.scheduledAt)}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium tracking-[.04em]">{schedule.couponCode}</div>
                                        <div className="text-[12px] text-muted">{schedule.couponTitle}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>{schedule.targetAll ? '全部會員' : `${schedule.memberCount} 位會員`}</div>
                                        {/* 只有已發送的才有張數，其他狀態是 null；停用的會員不發，所以可能比選的人數少 */}
                                        {schedule.sentCount !== null && (
                                            <div className="text-[12px] text-muted">共發出 {schedule.sentCount} 張</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={status?.color}>● {status?.name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {schedule.sentAt
                                            ? `${fmtDateTime(schedule.sentAt)}`
                                            : <span className="text-stone">—</span>}
                                    </td>
                                    <td className="px-4 py-3">{schedule.createdByName}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        {schedule.status === 'PENDING' && (
                                            <button type="button" onClick={() => onCancel(schedule)}
                                                    className="border border-line px-2.5 py-1 text-[12px] hover:border-[#b0413e] hover:text-[#b0413e]">
                                                取消預約
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {scheduleList.length === 0 && (
                <p className="py-10 text-center text-[13px] text-muted">沒有符合條件的預約</p>
            )}

            <Pagination page={page} totalPages={schedulePage.page?.totalPages} setPage={setPage}/>
        </div>
    )
}

export default ScheduleTable;
