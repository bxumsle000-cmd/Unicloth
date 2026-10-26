import { COUPON_SOURCES, MEMBER_COUPON_STATUSES, fmtDateTime } from "../../../js/admin.js";
import { money } from "../../../js/kinu.js";
import Pagination from "../../common/Pagination.jsx";

/**
 * 發券紀錄表格：每一列是會員拿到的一張券<br>
 * recordPage 是後端回的分頁物件（content = 這一頁的 CouponRecordResponse）；換頁交給 RecordPage（setPage）
 */
function RecordTable({ recordPage, page, setPage }) {
    const recordList = recordPage.content;

    return (
        <>
            <p className="mb-2 text-[12px] text-muted">共 {recordPage.page?.totalElements ?? 0} 筆</p>

            {/* 寬度不夠時表格自己橫向捲動，不會撐破整頁 */}
            <div className="overflow-x-auto border border-line bg-white">
                <table className="w-full min-w-[920px] text-left text-[13px]">
                    <thead className="border-b border-line bg-cream text-[11px] tracking-[.1em] text-muted">
                        <tr>
                            <th className="px-4 py-3 font-medium">發券時間</th>
                            <th className="px-4 py-3 font-medium">會員</th>
                            <th className="px-4 py-3 font-medium">折價券</th>
                            <th className="px-4 py-3 font-medium">來源</th>
                            <th className="px-4 py-3 font-medium">到期時間</th>
                            <th className="px-4 py-3 font-medium">狀態</th>
                            <th className="px-4 py-3 font-medium">使用紀錄</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recordList.map(record => {
                            const source = COUPON_SOURCES.find(couponSource => couponSource.key === record.source);
                            const status = MEMBER_COUPON_STATUSES.find(couponStatus => couponStatus.key === record.status);
                            return (
                                <tr key={record.id} className="border-b border-line last:border-b-0">
                                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDateTime(record.receivedAt)}</td>
                                    <td className="px-4 py-3">
                                        <div>{record.memberName ?? '（未填資料）'}</div>
                                        <div className="text-[12px] text-muted">{record.memberEmail}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium tracking-[.04em]">{record.couponCode}</div>
                                        <div className="text-[12px] text-muted">{record.couponTitle}</div>
                                    </td>
                                    <td className="px-4 py-3">{source?.name}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDateTime(record.expireAt)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span className={status?.color}>● {status?.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-[12px]">
                                        {/* 用過才有訂單編號和折抵金額，沒用過是 null */}
                                        {record.usedAt
                                            ? <>
                                                <div>{record.orderNo}</div>
                                                <div className="text-muted">{fmtDateTime(record.usedAt)}・折 {money(record.orderDiscount)}</div>
                                            </>
                                            : <span className="text-stone">—</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {recordList.length === 0 && (
                <p className="py-10 text-center text-[13px] text-muted">沒有符合條件的紀錄</p>
            )}

            <Pagination page={page} totalPages={recordPage.page?.totalPages} setPage={setPage}/>
        </>
    )
}

export default RecordTable;
