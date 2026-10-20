import { DEPARTMENTS, fmtDateTime } from "../../../js/admin.js";

const smallButtonClass = "ml-2 border border-line px-2.5 py-1 text-[12px] hover:border-black";

/**
 * 員工表格<br>
 * staffList 是後端 Page 的 content；編輯、重設密碼、停用用 onSetModal 開頁面上對應的視窗，啟用直接呼叫 onEnable
 */
function StaffTable({ staffList, myAccount, onSetModal, onEnable }) {
    return (
        // 寬度不夠時表格自己橫向捲動，不會撐破整頁
        <div className="overflow-x-auto border border-line bg-white">
            <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-line bg-cream text-[11px] tracking-[.1em] text-muted">
                    <tr>
                        <th className="px-4 py-3 font-medium">帳號</th>
                        <th className="px-4 py-3 font-medium">姓名</th>
                        <th className="px-4 py-3 font-medium">部門</th>
                        <th className="px-4 py-3 font-medium">狀態</th>
                        <th className="px-4 py-3 font-medium">最後登入</th>
                        <th className="px-4 py-3 text-right font-medium">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {staffList.map(staff => {
                        const isMe = staff.account === myAccount;
                        const isActive = staff.status === 'ACTIVE';
                        return (
                            <tr key={staff.account}
                                className={'border-b border-line last:border-b-0' + (isActive ? '' : ' text-muted')}>
                                <td className="px-4 py-3">
                                    {staff.account}
                                    {isMe && <span className="ml-1 text-[11px] text-muted">（你）</span>}
                                </td>
                                <td className="px-4 py-3">{staff.name}</td>
                                <td className="px-4 py-3">
                                    <span className="inline-block border border-line bg-paper px-2 py-0.5 text-[11px]">
                                        {DEPARTMENTS.find(dept => dept.key === staff.department)?.name}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {isActive
                                        ? <span className="text-[#2f6b3a]">● 啟用中</span>
                                        : <span className="text-[#b0413e]">● 已停用</span>}
                                </td>
                                <td className="px-4 py-3 text-muted">{fmtDateTime(staff.lastLoginAt)}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    {/* 自己的帳號不在這裡改，改密碼請用右上角設定 */}
                                    {isMe ? (
                                        <span className="text-[11px] text-muted">不能修改自己的帳號</span>
                                    ) : (
                                        <>
                                            <button type="button" onClick={() => onSetModal({ type: 'edit', staff: staff })} className={smallButtonClass}>編輯</button>
                                            <button type="button" onClick={() => onSetModal({ type: 'reset', staff: staff })} className={smallButtonClass}>重設密碼</button>
                                            {isActive ? (
                                                <button type="button" onClick={() => onSetModal({ type: 'disable', staff: staff })}
                                                        className={`${smallButtonClass} hover:border-[#b0413e] hover:text-[#b0413e]`}>
                                                    停用
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => onEnable(staff)}
                                                        className={`${smallButtonClass} text-[#111] hover:border-[#2f6b3a] hover:text-[#2f6b3a]`}>
                                                    啟用
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default StaffTable;
