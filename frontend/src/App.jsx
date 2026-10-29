import Header from "./component/store/layout/Header.jsx";
import Footer from "./component/store/layout/Footer.jsx";
import Home from "./pages/store/Home.jsx";
import Category from "./pages/store/Category.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Wishlist from "./pages/store/Wishlist.jsx";
import ProductDetail from "./pages/store/ProductDetail.jsx";
import Coupons from "./pages/store/Coupons.jsx";
import Cart from "./pages/store/Cart.jsx";
import Checkout from "./pages/store/Checkout.jsx";
import OrderComplete from "./pages/store/OrderComplete.jsx";
import Search from "./pages/store/Search.jsx";
import Orders from "./pages/store/Orders.jsx";
import Support from "./pages/store/Support.jsx";
import ShippingReturns from "./pages/store/ShippingReturns.jsx";
import Faq from "./pages/store/Faq.jsx";
import Login from "./pages/store/Login.jsx";
import CompleteProfile from "./pages/store/CompleteProfile.jsx";
import ProfileGuard from "./component/guard/ProfileGuard.jsx";
import RequireLogin from "./component/guard/RequireLogin.jsx";
import NewArrivals from "./pages/store/NewArrivals.jsx";
import Recommendations from "./pages/store/Recommendations.jsx";
import RecommendationSettings from "./pages/store/RecommendationSettings.jsx";
import MemberLayout from "./pages/store/MemberLayout.jsx";
import MemberProfile from "./pages/store/MemberProfile.jsx";
import { LanguageProvider } from "./js/LanguageProvider.jsx";
import { CountProvider } from "./js/CountProvider.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import ProductDepartmentHome from "./pages/admin/ProductDepartmentHome.jsx";
import OrderHome from "./pages/admin/OrderHome.jsx";
import CsHome from "./pages/admin/CsHome.jsx";
import MktHome from "./pages/admin/MktHome.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";

// 前台：上面 Header、下面 Footer，中間依網址換頁
// CountProvider 只包前台：Header 的收藏、購物車數字要讓各頁面都能通知更新
function StoreLayout(){
    return (
        <CountProvider>
            <div className="flex min-h-screen flex-col">
                <Header/>
                <main className="flex-1">
                    <ProfileGuard>
                        <Routes>
                            <Route path="/" element={<Home/>}/>
                            {/* 新品頁只顯示目前上架且勾選新品標籤的商品。 */}
                            <Route path="/new-arrivals" element={<NewArrivals/>}/>
                            <Route path="/category/:code" element={<Category/>}/>
                            <Route path="/wishlist/" element={<RequireLogin><Wishlist/></RequireLogin>}/>
                            <Route path="/product/:slug" element={<ProductDetail/>}/>
                            <Route path="/coupons" element={<RequireLogin><Coupons/></RequireLogin>}/>
                            <Route path="/cart" element={<RequireLogin><Cart/></RequireLogin>}/>
                            <Route path="/checkout" element={<RequireLogin><Checkout/></RequireLogin>}/>
                            <Route path="/order-complete" element={<OrderComplete/>}/>
                            <Route path="/search" element={<Search/>}/>
                            <Route path="/orders" element={<RequireLogin><Orders/></RequireLogin>}/>
                            {/* 客服單目前必須登入才能建立，規則與後端 SecurityConfig 一致。 */}
                            <Route path="/support" element={<RequireLogin><Support/></RequireLogin>}/>
                            {/* 配送與退貨、常見問題是純說明頁，訪客也能看。 */}
                            <Route path="/shipping-returns" element={<ShippingReturns/>}/>
                            <Route path="/faq" element={<Faq/>}/>
                            {/* 訪客看熱門商品，登入會員則取得個人化推薦。 */}
                            <Route path="/recommendations" element={<Recommendations/>}/>
                            {/* 會員中心：外框是 MemberLayout，裡面依網址換子頁面；必須登入才能使用。 */}
                            <Route path="/member" element={<RequireLogin><MemberLayout/></RequireLogin>}>
                                <Route index element={<MemberProfile/>}/>
                                <Route path="recommendation-settings" element={<RecommendationSettings/>}/>
                            </Route>
                            {/* 推薦設定搬進會員中心，舊網址導過去 */}
                            <Route path="/recommendation-settings" element={<Navigate to="/member/recommendation-settings" replace/>}/>
                            <Route path="/login" element={<Login/>}/>
                            <Route path="/complete-profile" element={<CompleteProfile/>}/>
                        </Routes>
                    </ProfileGuard>
                </main>
                <Footer/>
            </div>
        </CountProvider>
    )
}

// 後台：不套前台的 Header / Footer / ProfileGuard
// 這裡的 path 是接在 /admin/ 後面的，例如 "login" 就是 /admin/login
function AdminLayout(){
    return (
        <Routes>
            <Route path="login" element={<AdminLogin/>}/>
            {/* 各部門首頁：路徑跟後端 API 一樣用部門代號小寫（/api/admin/product/...） */}
            <Route path="product" element={<ProductDepartmentHome/>}/>
            <Route path="order" element={<OrderHome/>}/>
            <Route path="cs" element={<CsHome/>}/>
            <Route path="mkt" element={<MktHome/>}/>
            <Route path="admin" element={<AdminHome/>}/>
        </Routes>
    )
}

function App(){
    return (
        <LanguageProvider>
            <BrowserRouter>
                <Routes>
                    {/* /admin 開頭的網址交給 AdminLayout，其他都交給前台 StoreLayout */}
                    <Route path="/admin/*" element={<AdminLayout/>}/>
                    <Route path="*" element={<StoreLayout/>}/>
                </Routes>
            </BrowserRouter>
        </LanguageProvider>
    )
}

export default App;