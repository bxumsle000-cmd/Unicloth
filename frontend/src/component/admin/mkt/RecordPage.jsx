import { useEffect, useState } from "react";
import { COUPON_SOURCES, MEMBER_COUPON_STATUSES, adminApi } from "../../../js/admin.js";
import { toast } from "../../../js/kinu.js";
import RecordTable from "./RecordTable.jsx";

const filterClass = "border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black";

/** 發券紀錄子頁面：篩選列 + 每張發出去的券一列（篩選和分頁都在後端做） */
function RecordPage() {
    // 後端回的分頁物件：content 是這一頁的 CouponRecordResponse，page.totalPages 是總頁數；null = 還沒載入完
    const [recordPage, setRecordPage] = useState(null);
    // 折價券篩選選單用的 AdminCouponResponse 陣列
    const [couponList, setCouponList] = useState([]);

    // 搜尋框裡正在打的字；按「搜尋」或 Enter 才放進 keyword 去查，不會每打一個字就查一次
    const [searchText, setSearchText] = useState('');
    // 篩選條件，'' = 不篩
    const [keyword, setKeyword] = useState('');
    const [couponId, setCouponId] = useState('');
    const [source, setSource] = useState('');     // COUPON_SOURCES 的 key
    const [status, setStatus] = useState('');     // MEMBER_COUPON_STATUSES 的 key
    const [receivedFrom, setReceivedFrom] = useState(''); // 格式 2026-10-01，只填一邊也可以
    const [receivedTo, setReceivedTo] = useState('');
    // 第幾頁，從 0 開始（跟後端一樣）
    const [page, setPage] = useState(0);

    useEffect(() => {
        adminApi('/api/admin/mkt/coupons')
            .then(setCouponList)
            .catch((e) => toast(e.message, true));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page) });
        if (keyword) params.set('keyword', keyword);
        if (couponId) params.set('couponId', couponId);
        if (source) params.set('source', source);
        if (status) params.set('status', status);
        if (receivedFrom) params.set('receivedFrom', receivedFrom);
        if (receivedTo) params.set('receivedTo', receivedTo);

        adminApi(`/api/admin/mkt/coupons/records?${params}`)
            .then(setRecordPage)
            .catch((e) => toast(e.message, true));
    }, [keyword, couponId, source, status, receivedFrom, receivedTo, page]);

    function search() {
        setKeyword(searchText.trim());
        setPage(0);
    }

    // 換篩選時回到第一頁
    function changeFilter(setFilter, newValue) {
        setFilter(newValue);
        setPage(0);
    }

    return (
        <section>
            <div className="mb-6">
                <div className="text-[10px] tracking-[.22em] text-muted">RECORDS</div>
                <h1 className="text-[24px] font-medium tracking-[.08em]">發券紀錄</h1>
            </div>

            {/* 篩選列 */}
            <div className="mb-4 flex flex-wrap gap-3">
                <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
                       onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
                       placeholder="搜尋會員姓名或 Email" className={`w-[220px] max-[760px]:w-full ${filterClass}`}/>
                <button type="button" onClick={search}
                        className="border border-black bg-black px-4 py-2 text-[12px] tracking-[.1em] text-white hover:opacity-80">
                    搜尋
                </button>
                <select value={couponId} onChange={(e) => changeFilter(setCouponId, e.target.value)} className={filterClass}>
                    <option value="">全部折價券</option>
                    {couponList.map(coupon => (
                        <option key={coupon.id} value={coupon.id}>{coupon.code}｜{coupon.title}</option>
                    ))}
                </select>
                <select value={source} onChange={(e) => changeFilter(setSource, e.target.value)} className={filterClass}>
                    <option value="">全部來源</option>
                    {COUPON_SOURCES.map(couponSource => (
                        <option key={couponSource.key} value={couponSource.key}>{couponSource.name}</option>
                    ))}
                </select>
                <select value={status} onChange={(e) => changeFilter(setStatus, e.target.value)} className={filterClass}>
                    <option value="">全部狀態</option>
                    {MEMBER_COUPON_STATUSES.map(couponStatus => (
                        <option key={couponStatus.key} value={couponStatus.key}>{couponStatus.name}</option>
                    ))}
                </select>
                {/* 發券日期區間：結束日不能早於開始日（用 min / max 擋） */}
                <div className="flex items-center gap-2 text-[13px] max-[760px]:w-full">
                    <span className="text-[12px] text-muted">發券日期</span>
                    <input type="date" value={receivedFrom} max={receivedTo}
                           onChange={(e) => changeFilter(setReceivedFrom, e.target.value)}
                           className={`max-[760px]:min-w-0 max-[760px]:flex-1 ${filterClass}`}/>
                    <span className="text-muted">～</span>
                    <input type="date" value={receivedTo} min={receivedFrom}
                           onChange={(e) => changeFilter(setReceivedTo, e.target.value)}
                           className={`max-[760px]:min-w-0 max-[760px]:flex-1 ${filterClass}`}/>
                </div>
            </div>

            {recordPage && <RecordTable recordPage={recordPage} page={page} setPage={setPage}/>}
        </section>
    )
}

export default RecordPage;
