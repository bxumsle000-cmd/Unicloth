import { useEffect, useState } from "react";
import { SALES_RANGE_OPTIONS, adminApi, fmtDate } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import ToggleButtons from "./ToggleButtons.jsx";
import SalesFilterBar from "./SalesFilterBar.jsx";
import SalesStatCards from "./SalesStatCards.jsx";
import MemberBuyerTypeTable from "./MemberBuyerTypeTable.jsx";
import MemberGenderAgeCharts from "./MemberGenderAgeCharts.jsx";
import MemberTopList from "./MemberTopList.jsx";
import MemberSignupChart from "./MemberSignupChart.jsx";

/**
 * 會員與顧客子頁面：期間按鈕、篩選列、指標卡片、新客與回購客、性別與年齡層、消費 Top 10、每月新註冊會員數<br>
 * 點性別、年齡層的長條可以篩選（兩個可以同時選），篩選後重新跟 Python 要資料
 */
function MemberCustomersPage() {
    const [range, setRange] = useState('30d');         // SALES_RANGE_OPTIONS 的 key
    // 篩選條件：null = 不篩選；gender 是 'female' / 'male'，ageGroup 是 'u24' / '25-34' / '35-44' / '45up'
    const [gender, setGender] = useState(null);
    const [ageGroup, setAgeGroup] = useState(null);
    // 後端回的資料（格式見 analytics/member_customers.py 的 get_member_customers）；null = 還沒載入完
    const [memberCustomers, setMemberCustomers] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams({ range: range });
        if (gender !== null) params.set('gender', gender);
        if (ageGroup !== null) params.set('age', ageGroup);
        adminApi(`/api/admin/mkt/sales/members?${params}`)
            .then(setMemberCustomers)
            .catch((e) => toast(e.message, true));
    }, [range, gender, ageGroup]);

    function clearFilter() {
        setGender(null);
        setAgeGroup(null);
    }

    // 篩選條件列：性別、年齡層各一個，可以分開取消
    function filterChipList(filter) {
        const chipList = [];
        if (filter.gender) chipList.push({ name: filter.gender.name, onRemove: () => setGender(null) });
        if (filter.ageGroup) chipList.push({ name: filter.ageGroup.name, onRemove: () => setAgeGroup(null) });
        return chipList;
    }

    return (
        <section>
            {/* 標題 + 期間篩選 */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] tracking-[.22em] text-muted">SALES</div>
                    <h1 className="text-[24px] font-medium tracking-[.08em]">會員與顧客</h1>
                    {memberCustomers && (
                        <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                            {fmtDate(memberCustomers.start)} ～ {fmtDate(memberCustomers.end)} ・ 依下單時間（created_at），只算有效訂單
                        </p>
                    )}
                </div>
                <ToggleButtons optionList={SALES_RANGE_OPTIONS} currentKey={range} onChange={setRange}/>
            </div>

            {memberCustomers && (
                <>
                    <SalesFilterBar chipList={filterChipList(memberCustomers.filter)} onClear={clearFilter}
                                    hint="目前顯示全部會員。點下方「性別」「年齡層」的長條，整頁會跟著篩選"/>
                    <SalesStatCards cardList={kpiCardList(memberCustomers.kpi)}
                                    gridClass="grid-cols-4 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1"/>
                    <MemberBuyerTypeTable buyerTypeList={memberCustomers.buyerTypeList}/>
                    <MemberGenderAgeCharts genderList={memberCustomers.genderList} ageGroupList={memberCustomers.ageGroupList}
                                           gender={gender} ageGroup={ageGroup}
                                           onClickGender={key => setGender(gender === key ? null : key)}
                                           onClickAgeGroup={key => setAgeGroup(ageGroup === key ? null : key)}/>
                    <MemberTopList topList={memberCustomers.topList}/>
                    <MemberSignupChart signupList={memberCustomers.signupList} end={memberCustomers.end}
                                       hasFilter={gender !== null || ageGroup !== null}/>
                </>
            )}
        </section>
    )
}

/** 有小數的百分比：12.3%；沒辦法算（分母是 0）顯示 — */
function percentText(percent) {
    return percent === null ? '—' : `${percent.toFixed(1)}%`;
}

/** 四張指標卡片：下單會員數、新客、回購客、新註冊會員 */
function kpiCardList(kpi) {
    const percentOf = count => kpi.buyers === 0 ? null : count / kpi.buyers * 100;
    return [
        { name: '下單會員數', value: kpi.buyers.toLocaleString('zh-TW'), note: '這段期間有有效訂單的會員' },
        { name: '新客', value: kpi.newBuyers.toLocaleString('zh-TW'), note: `佔下單會員 ${percentText(percentOf(kpi.newBuyers))}` },
        { name: '回購客', value: kpi.returningBuyers.toLocaleString('zh-TW'), note: `佔下單會員 ${percentText(percentOf(kpi.returningBuyers))}` },
        { name: '新註冊會員', value: kpi.signups.toLocaleString('zh-TW'), note: '這段期間註冊的會員' },
    ];
}

export default MemberCustomersPage;
