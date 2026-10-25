import { useEffect, useState } from "react";
import { adminApi, fmtDateTime } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import IssueForm from "./IssueForm.jsx";
import ScheduleTable from "./ScheduleTable.jsx";

/** 發券給會員子頁面：上面發券表單，下面預約發送紀錄（後端分頁） */
function IssuePage() {
    // 後端回的分頁物件：content 是這一頁的 CouponScheduleResponse，page.totalPages 是總頁數；null = 還沒載入完
    const [schedulePage, setSchedulePage] = useState(null);
    // 狀態篩選，'' = 不篩；其他是 COUPON_SCHEDULE_STATUSES 的 key
    const [statusFilter, setStatusFilter] = useState('');
    // 第幾頁，從 0 開始（跟後端一樣）
    const [page, setPage] = useState(0);

    // 建立預約、取消預約成功後，或按「重新整理」時 +1，讓下面查列表的 useEffect 再跑一次
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page) });
        if (statusFilter) params.set('status', statusFilter);

        adminApi(`/api/admin/mkt/coupons/schedules?${params}`)
            .then((result) => {
                // 這一頁的最後一筆被取消後（例如篩選「等待中」時），這一頁會變空，退回上一頁
                if (result.content.length === 0 && page > 0) {
                    setPage(page - 1);
                    return;
                }
                setSchedulePage(result);
            })
            .catch((e) => toast(e.message, true));
    }, [reloadKey, statusFilter, page]);

    // 重新查一次預約列表（reloadKey 變了，上面的 useEffect 就會再跑）
    function reload() {
        setReloadKey(key => key + 1);
    }

    // 換篩選時回到第一頁
    function changeStatusFilter(newStatus) {
        setStatusFilter(newStatus);
        setPage(0);
    }

    async function cancelSchedule(schedule) {
        const confirmed = window.confirm(`確定要取消 ${fmtDateTime(schedule.scheduledAt)} 發送 ${schedule.couponCode} 的預約嗎？`);
        if (!confirmed) {
            return;
        }
        try {
            await adminApi(`/api/admin/mkt/coupons/schedules/${schedule.id}/cancel`, { method: 'PATCH' });
            toast('已取消預約');
            reload();
        } catch (e) {
            toast(e.message, true);
        }
    }

    return (
        <section>
            <div className="mb-6">
                <div className="text-[10px] tracking-[.22em] text-muted">ISSUE</div>
                <h1 className="text-[24px] font-medium tracking-[.08em]">發券給會員</h1>
            </div>

            <IssueForm onIssued={reload}/>
            {schedulePage && (
                <ScheduleTable schedulePage={schedulePage}
                               statusFilter={statusFilter} onChangeStatusFilter={changeStatusFilter}
                               page={page} setPage={setPage}
                               onCancel={cancelSchedule} onReload={reload}/>
            )}
        </section>
    )
}

export default IssuePage;
