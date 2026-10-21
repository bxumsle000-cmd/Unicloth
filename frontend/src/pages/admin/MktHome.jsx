// 行銷首頁（/admin/mkt），內容之後再做
import { useState } from "react";
import AdminHeader from "../../component/admin/AdminHeader.jsx";
import SideMenu from "../../component/admin/mkt/SideMenu.jsx";

function MktHome() {
    // 目前在哪個子頁面，值是 SideMenu 裡 MENU_GROUPS 的 page.key：'coupon' | 'issue' | 'records'
    const [currentPage, setCurrentPage] = useState('coupon');

    return (
        <div className="flex min-h-screen bg-paper font-kinu text-[#111] max-[760px]:flex-col">

            {/* 左邊：側邊選單 */}
            <SideMenu currentPage={currentPage} onChangePage={setCurrentPage}/>

            {/* 右邊：頂部列 + 內容區 */}
            <div className="flex min-w-0 flex-1 flex-col">
                <AdminHeader/>

                <main className="flex-1 px-8 py-8 max-[760px]:px-4">
                    <h1 className="text-[24px] font-medium tracking-[.08em]">行銷</h1>
                </main>
            </div>
        </div>
    )
}

export default MktHome;
