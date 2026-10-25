import { useEffect, useState } from "react";
import { adminApi } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";

/**
 * 選會員：搜尋會員、複選，顯示已選幾位（選「指定會員」才顯示）
 * selectedMemberIds：已勾選的會員 id 陣列
 * onChangeSelected：勾選／取消時呼叫，傳入新的 id 陣列
 */
function MemberPicker({ selectedMemberIds, onChangeSelected }) {
    // 後端回的 IssueMemberResponse 陣列（只有 ACTIVE 的會員）；null = 還沒載入完
    const [memberList, setMemberList] = useState(null);
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        adminApi('/api/admin/mkt/members')
            .then(setMemberList)
            .catch((e) => toast(e.message, true));
    }, []);

    // 姓名或 Email 包含關鍵字；還沒補填資料的會員沒有姓名，只比 Email
    const trimmedKeyword = keyword.trim();
    const matchedMembers = (memberList ?? []).filter(member =>
        !trimmedKeyword
        || member.name?.includes(trimmedKeyword)
        || member.email.includes(trimmedKeyword));

    function toggleMember(memberId) {
        onChangeSelected(selectedMemberIds.includes(memberId)
            ? selectedMemberIds.filter(selectedId => selectedId !== memberId)
            : [...selectedMemberIds, memberId]);
    }

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-[.12em] text-muted">選擇會員（可複選）</span>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜尋姓名或 Email"
                   className="border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black"/>

            <div className="max-h-[220px] overflow-y-auto border border-line bg-white">
                {memberList === null && (
                    <p className="px-3 py-4 text-center text-[12px] text-muted">載入中…</p>
                )}
                {memberList !== null && matchedMembers.length === 0 && (
                    <p className="px-3 py-4 text-center text-[12px] text-muted">找不到會員</p>
                )}
                {matchedMembers.map(member => (
                    <label key={member.id}
                           className="flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2 text-[13px] last:border-b-0 hover:bg-paper">
                        <input type="checkbox" checked={selectedMemberIds.includes(member.id)}
                               onChange={() => toggleMember(member.id)} className="accent-black"/>
                        <span>{member.name ?? '（未填資料）'}</span>
                        <span className="text-[12px] text-muted">{member.email}</span>
                    </label>
                ))}
            </div>

            <span className="text-[11px] text-muted">已選 {selectedMemberIds.length} 位</span>
        </div>
    )
}

export default MemberPicker;
