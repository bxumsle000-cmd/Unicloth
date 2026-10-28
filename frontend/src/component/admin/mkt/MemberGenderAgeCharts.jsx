import { useState } from "react";
import SalesBarChart from "./SalesBarChart.jsx";
import ToggleButtons from "./ToggleButtons.jsx";

const MEASURE_OPTIONS = [
    { key: 'amount', name: '消費金額' },
    { key: 'buyers', name: '下單人數' },
];

/**
 * 性別與年齡層：長條長度看目前選的數字（消費金額或下單人數），滑鼠移上去三個數字都看得到；點長條可以篩選
 * genderList、ageGroupList：[{ key, name, buyers, amount, avgAmount }]
 * gender、ageGroup：目前篩選的 key（被選到的長條維持原色）
 * onClickGender、onClickAgeGroup：點長條時呼叫，傳入那一組的 key
 */
function MemberGenderAgeCharts({ genderList, ageGroupList, gender, ageGroup, onClickGender, onClickAgeGroup }) {
    const [measure, setMeasure] = useState('amount');   // MEASURE_OPTIONS 的 key

    // 長條右邊的字：「NT$ 12,345（45.6%）」或「12 人（45.6%）」
    function textList(groupList) {
        const total = groupList.reduce((sum, group) => sum + group[measure], 0);
        return groupList.map(group => {
            const value = measure === 'amount'
                ? `NT$ ${group.amount.toLocaleString('zh-TW')}`
                : `${group.buyers.toLocaleString('zh-TW')} 人`;
            return `${value}（${total === 0 ? '—' : (group[measure] / total * 100).toFixed(1) + '%'}）`;
        });
    }

    function hoverTextList(groupList) {
        return groupList.map(group => `${group.name}<br>消費金額 NT$ ${group.amount.toLocaleString('zh-TW')}`
            + `<br>下單人數 ${group.buyers.toLocaleString('zh-TW')} 人`
            + `<br>平均每人 ${group.avgAmount === null ? '—' : 'NT$ ' + group.avgAmount.toLocaleString('zh-TW')}`);
    }

    return (
        <div className="mb-6 border border-line bg-white p-6 max-[760px]:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-medium tracking-[.08em]">性別與年齡層</h2>
                    <p className="mt-1 text-[12px] tracking-[.06em] text-muted">
                        年齡由生日（birthday）換算成今天的年齡；滑鼠移到長條上可以看平均每人消費。點長條可以篩選整頁，再點一次取消
                    </p>
                </div>
                <ToggleButtons optionList={MEASURE_OPTIONS} currentKey={measure} onChange={setMeasure}/>
            </div>
            <div className="mt-4 grid grid-cols-[2fr_3fr] gap-6 max-[1100px]:grid-cols-1">
                <div>
                    <div className="text-[12px] tracking-[.08em] text-muted">性別</div>
                    <SalesBarChart horizontal heightClass="h-[160px]" textMargin={170}
                                   labelList={genderList.map(group => group.name)}
                                   valueList={genderList.map(group => group[measure])}
                                   textList={textList(genderList)}
                                   hoverTextList={hoverTextList(genderList)}
                                   isSelectedList={genderList.map(group => group.key === gender)}
                                   onClickBar={index => onClickGender(genderList[index].key)}/>
                </div>
                <div>
                    <div className="text-[12px] tracking-[.08em] text-muted">年齡層</div>
                    <SalesBarChart horizontal heightClass="h-[200px]" textMargin={170}
                                   labelList={ageGroupList.map(group => group.name)}
                                   valueList={ageGroupList.map(group => group[measure])}
                                   textList={textList(ageGroupList)}
                                   hoverTextList={hoverTextList(ageGroupList)}
                                   isSelectedList={ageGroupList.map(group => group.key === ageGroup)}
                                   onClickBar={index => onClickAgeGroup(ageGroupList[index].key)}/>
                </div>
            </div>
        </div>
    )
}

export default MemberGenderAgeCharts;
