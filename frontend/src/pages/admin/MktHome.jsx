// 行銷首頁（/admin/mkt），內容之後再做
import { lazy, Suspense, useState } from "react";
import AdminHeader from "../../component/admin/shared/AdminHeader.jsx";
import SideMenu from "../../component/admin/mkt/SideMenu.jsx";
import CouponPage from "../../component/admin/mkt/CouponPage.jsx";
import IssuePage from "../../component/admin/mkt/IssuePage.jsx";
import RecordPage from "../../component/admin/mkt/RecordPage.jsx";

// 銷售數據的頁面用到 Plotly（很大，約 4 MB），點進去才下載，不拖慢前台和其他後台頁
const SalesOverviewPage = lazy(() => import("../../component/admin/mkt/SalesOverviewPage.jsx"));
const ProductSalesPage = lazy(() => import("../../component/admin/mkt/ProductSalesPage.jsx"));
const OrderStructurePage = lazy(() => import("../../component/admin/mkt/OrderStructurePage.jsx"));
const MemberCustomersPage = lazy(() => import("../../component/admin/mkt/MemberCustomersPage.jsx"));
const CouponPerformancePage = lazy(() => import("../../component/admin/mkt/CouponPerformancePage.jsx"));

function MktHome() {
    // 目前在哪個子頁面，值是 SideMenu 裡 MENU_GROUPS 的 page.key：'coupon' | 'issue' | 'records' | 'salesOverview' | 'productSales' | 'orderStructure' | 'memberCustomers' | 'couponPerformance'
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
                    {currentPage === 'issue' && <IssuePage/>}
                    {currentPage === 'records' && <RecordPage/>}
                    <Suspense fallback={<p className="text-[13px] text-muted">載入中…</p>}>
                        {currentPage === 'salesOverview' && <SalesOverviewPage/>}
                        {currentPage === 'productSales' && <ProductSalesPage/>}
                        {currentPage === 'orderStructure' && <OrderStructurePage/>}
                        {currentPage === 'memberCustomers' && <MemberCustomersPage/>}
                        {currentPage === 'couponPerformance' && <CouponPerformancePage/>}
                    </Suspense>
                </main>
            </div>
        </div>
    )
}

export default MktHome;
