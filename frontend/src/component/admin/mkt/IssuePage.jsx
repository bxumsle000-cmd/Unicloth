import { useEffect, useState } from "react";
import { adminApi, fmtDateTime } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import IssueForm from "./IssueForm.jsx";
import ScheduleTable from "./ScheduleTable.jsx";

/** 發券給會員子頁面：上面發券表單，下面預約發送紀錄 */
function IssuePage() {
    // 後端回的 CouponScheduleResponse 陣列；null = 還沒載入完
    const [scheduleList, setScheduleList] = useState(null);

    // 建立預約、取消預約成功後，或按「重新整理」時 +1，讓下面查列表的 useEffect 再跑一次
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        adminApi('/api/admin/mkt/coupons/schedules')
            .then(setScheduleList)
            .catch((e) => toast(e.message, true));
    }, [reloadKey]);

    // 重新查一次預約列表（reloadKey 變了，上面的 useEffect 就會再跑）
    function reload() {
        setReloadKey(key => key + 1);
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
            {scheduleList && <ScheduleTable scheduleList={scheduleList} onCancel={cancelSchedule} onReload={reload}/>}
        </section>
    )
}

export default IssuePage;
