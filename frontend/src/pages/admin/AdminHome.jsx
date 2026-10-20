import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdAdd } from "react-icons/md";
import { ADMIN_ACCOUNT_KEY, ADMIN_TOKEN_KEY, DEPARTMENTS, adminApi } from "../../js/admin.js";
import { toast } from "../../js/kinu.js";
import Pagination from "../../component/product/Pagination.jsx";
import AdminHeader from "../../component/admin/AdminHeader.jsx";
import StaffTable from "../../component/admin/staff/StaffTable.jsx";
import CreateStaffModal from "../../component/admin/staff/CreateStaffModal.jsx";
import EditNameModal from "../../component/admin/staff/EditNameModal.jsx";
import ResetPasswordModal from "../../component/admin/staff/ResetPasswordModal.jsx";
import DisableModal from "../../component/admin/staff/DisableModal.jsx";

const blackButtonClass = "border border-black bg-black px-4 py-2.5 text-[12px] tracking-[.12em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";

const filterClass = "border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-black";

// 管理者首頁（/admin/admin）：員工帳號管理
function AdminHome() {
    const navigate = useNavigate();
    const myAccount = localStorage.getItem(ADMIN_ACCOUNT_KEY);

    // 篩選條件、頁碼（page 從 0 開始，跟後端一樣）
    const [keyword, setKeyword] = useState('');
    const [department, setDepartment] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);

    // 後端回的 Page：{ content: [...], page: { totalPages, totalElements, ... } }；null = 還沒載入完
    const [staffList, setStaffList] = useState(null);
    // 目前開著哪個視窗：{ type: 'create' | 'edit' | 'reset' | 'disable', staff: 被點的員工 }；null = 都沒開
    const [modal, setModal] = useState(null);

    // 新增、改名、停用、啟用成功後 +1，讓下面查列表的 useEffect 再跑一次
    const [reloadKey, setReloadKey] = useState(0);

    // 沒登入就回登入頁
    useEffect(() => {
        if (!localStorage.getItem(ADMIN_TOKEN_KEY)) navigate('/admin/login');
    }, []);

    useEffect(() => {
        const params = new URLSearchParams({ page: page, size: 20 });
        if (keyword) params.set('keyword', keyword);
        if (department) params.set('department', department);
        if (status) params.set('status', status);

        adminApi(`/api/admin/admin/staff?${params}`)
            .then(setStaffList)
            .catch((e) => toast(e.message, true));
    }, [keyword, department, status, page, reloadKey]);

    // 重新查一次員工列表（reloadKey 變了，上面的 useEffect 就會再跑）
    function reload() {
        setReloadKey(key => key + 1);
    }

    // 啟用不像停用會擋人登入，不用再確認，直接送出
    async function enable(staff) {
        try {
            await adminApi(`/api/admin/admin/staff/${staff.account}/enable`, { method: 'PATCH' });
            toast(`${staff.account} 已啟用`);
            reload();
        } catch (e) {
            toast(e.message, true);
        }
    }

    return (
        <div className="flex min-h-screen bg-paper font-kinu text-[#111] max-[760px]:flex-col">

            {/* 左邊：側邊選單 */}
            <aside className="w-[220px] shrink-0 border-r border-line bg-white max-[760px]:w-full max-[760px]:border-r-0 max-[760px]:border-b">
                <div className="mt-1 text-[16px] font-medium tracking-[.08em] px-6 py-6 max-[760px]:py-4">系統管理</div>
                <nav className="flex flex-col pb-6 max-[760px]:flex-row max-[760px]:pb-0">
                    <div className="border-l-2 border-black bg-paper px-6 py-3 text-[13px] font-medium tracking-[.08em]
                                    max-[760px]:border-l-0 max-[760px]:border-b-2 max-[760px]:px-4">
                        員工帳號
                    </div>
                </nav>
            </aside>

            {/* 右邊：頂部列 + 內容區 */}
            <div className="flex min-w-0 flex-1 flex-col">
                <AdminHeader/>

                <main className="flex-1 px-8 py-8 max-[760px]:px-4">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="text-[10px] tracking-[.22em] text-muted">STAFF</div>
                            <h1 className="text-[24px] font-medium tracking-[.08em]">員工帳號</h1>
                        </div>
                        <button type="button" onClick={() => setModal({ type: 'create' })}
                                className={`${blackButtonClass} flex items-center gap-1`}>
                            <MdAdd className="text-[16px]"/>新增員工
                        </button>
                    </div>

                    {/* 篩選列：換條件就回第一頁；搜尋框按 Enter 才搜尋，打字時不查 */}
                    <div className="mb-4 flex flex-wrap gap-3">
                        <input type="text" placeholder="搜尋帳號或姓名，按 Enter 搜尋"
                               onKeyDown={(e) => { if (e.key === 'Enter') { setKeyword(e.target.value.trim()); setPage(0); } }}
                               className={`${filterClass} w-[220px] max-[760px]:w-full`}/>
                        <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(0); }} className={filterClass}>
                            <option value="">全部部門</option>
                            {DEPARTMENTS.map(dept => <option key={dept.key} value={dept.key}>{dept.name}</option>)}
                        </select>
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className={filterClass}>
                            <option value="">全部狀態</option>
                            <option value="ACTIVE">啟用中</option>
                            <option value="DISABLED">已停用</option>
                        </select>
                    </div>

                    <StaffTable staffList={staffList?.content ?? []} myAccount={myAccount}
                                onSetModal={setModal} onEnable={enable}/>

                    {!staffList && <p className="py-10 text-center text-[13px] text-muted">載入中…</p>}
                    {staffList?.content.length === 0 && (
                        <p className="py-10 text-center text-[13px] text-muted">沒有符合條件的員工</p>
                    )}

                    <Pagination page={page} totalPages={staffList?.page?.totalPages} setPage={setPage}/>
                </main>
            </div>

            {modal?.type === 'create' && <CreateStaffModal onClose={() => setModal(null)}
                                                           reload={reload}/>}
            {modal?.type === 'edit' && <EditNameModal staff={modal.staff} onClose={() => setModal(null)}
                                                       reload={reload}/>}
            {modal?.type === 'reset' && <ResetPasswordModal staff={modal.staff} onClose={() => setModal(null)}/>}
            {modal?.type === 'disable' && <DisableModal staff={modal.staff} onClose={() => setModal(null)}
                                                          reload={reload}/>}
        </div>
    )
}

export default AdminHome;
