import { fmtDate } from "../../../js/admin.js";
import SalesBarChart from "./SalesBarChart.jsx";

/**
 * 每月新註冊會員數：固定看最近 12 個月，不受上方期間影響，但會套用性別、年齡層的篩選
 * signupList：[{ month: '2026/10', count, partial: 這個月還沒過完 }]；還沒過完的月份用淡色
 * end：資料算到哪天；hasFilter：有沒有篩選（有的話提醒不含沒補填資料的會員）
 */
function MemberSignupChart({ signupList, end, hasFilter }) {
    const lastMonth = signupList[signupList.length - 1];

    return (
        <div className="border border-line bg-white p-6 max-[760px]:p-4">
            <h2 className="text-[14px] font-medium tracking-[.08em]">每月新註冊會員數</h2>
            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                最近 12 個月，依註冊時間（members.created_at），不受上方期間影響
                {lastMonth.partial && `。${lastMonth.month} 只算到 ${fmtDate(end)}，所以比較少`}
                {hasFilter && '。有篩選時不含還沒補填資料的會員'}
            </p>
            <SalesBarChart heightClass="h-[280px]"
                           labelList={signupList.map(row => row.month)}
                           valueList={signupList.map(row => row.count)}
                           textList={signupList.map(row => row.count.toLocaleString('zh-TW'))}
                           hoverTemplate="%{x}<br>%{y:,} 位新會員"
                           // 過完的月份「被選到」維持原色，還沒過完的變淡
                           isSelectedList={signupList.map(row => !row.partial)}/>
        </div>
    )
}

export default MemberSignupChart;
