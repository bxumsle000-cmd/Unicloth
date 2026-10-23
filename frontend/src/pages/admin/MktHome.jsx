// 行銷首頁（/admin/mkt），內容之後再做
import { useState } from "react";
import AdminHeader from "../../component/admin/shared/AdminHeader.jsx";
import SideMenu from "../../component/admin/mkt/SideMenu.jsx";
import CouponPage from "../../component/admin/mkt/CouponPage.jsx";

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
                    {currentPage === 'coupon' && <CouponPage/>}
                </main>
            </div>
        </div>
    )
}

export default MktHome;
