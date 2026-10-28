/**
 * 消費金額 Top 10 會員：名次 + 姓名 + 長條，長條長度 = 跟第 1 名比的比例
 * topList：[{ id, name, gender, age, isNew, amount, orderCount }]
 */
function MemberTopList({ topList }) {
    const max = topList.length > 0 ? topList[0].amount : 0;

    return (
        <div className="mb-6 border border-line bg-white p-6 max-[760px]:p-4">
            <h2 className="text-[14px] font-medium tracking-[.08em]">消費金額 Top 10 會員</h2>
            <p className="mt-1 text-[12px] tracking-[.06em] text-muted">這段期間有效訂單的消費金額加總</p>
            {topList.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted">這段期間沒有會員下單</p>
            ) : (
                <ol className="mt-4">
                    {topList.map((member, index) => (
                        <li key={member.id} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
                            <span className={'w-6 text-right text-[14px] font-semibold tabular-nums ' + (index < 3 ? '' : 'text-muted')}>
                                {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center text-[13px] tracking-[.04em]">
                                    <span className="truncate">{member.name}</span>
                                    <span className="ml-2 shrink-0 border border-line px-1.5 py-0.5 text-[11px] text-muted">
                                        {member.isNew ? '新客' : '回購客'}
                                    </span>
                                </div>
                                <div className="mt-0.5 text-[12px] tracking-[.04em] text-muted">
                                    會員編號 {member.id}
                                    {member.gender && `・${member.gender}`}
                                    {member.age !== null && `・${member.age} 歲`}
                                </div>
                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#e6eef9]">
                                    <div className="h-1.5 rounded-full bg-[#2a78d6]" style={{ width: `${member.amount / max * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="w-[120px] shrink-0 text-right tabular-nums max-[560px]:w-[96px]">
                                <div className="text-[14px] font-semibold">NT$ {member.amount.toLocaleString('zh-TW')}</div>
                                <div className="text-[12px] text-muted">{member.orderCount.toLocaleString('zh-TW')} 筆訂單</div>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}

export default MemberTopList;
