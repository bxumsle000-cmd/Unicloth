import Header from "./component/store/layout/Header.jsx";
import Footer from "./component/store/layout/Footer.jsx";
import Home from "./pages/store/Home.jsx";
import Category from "./pages/store/Category.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Wishlist from "./pages/store/Wishlist.jsx";
import ProductDetail from "./pages/store/ProductDetail.jsx";
import Coupons from "./pages/store/Coupons.jsx";
import Cart from "./pages/store/Cart.jsx";
import Checkout from "./pages/store/Checkout.jsx";
import OrderComplete from "./pages/store/OrderComplete.jsx";
import Search from "./pages/store/Search.jsx";
import Orders from "./pages/store/Orders.jsx";
import Support from "./pages/store/Support.jsx";
import Login from "./pages/store/Login.jsx";
import CompleteProfile from "./pages/store/CompleteProfile.jsx";
import ProfileGuard from "./component/guard/ProfileGuard.jsx";
import RequireLogin from "./component/guard/RequireLogin.jsx";
import { LanguageProvider } from "./js/LanguageProvider.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import ProductDepartmentHome from "./pages/admin/ProductDepartmentHome.jsx";
import OrderHome from "./pages/admin/OrderHome.jsx";
import CsHome from "./pages/admin/CsHome.jsx";
import MktHome from "./pages/admin/MktHome.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";

// 前台：上面 Header、下面 Footer，中間依網址換頁
function StoreLayout(){
    return (
        <div className="flex min-h-screen flex-col">
            <Header/>
            <main className="flex-1">
                <ProfileGuard>
                    <Routes>
                        <Route path="/" element={<Home/>}/>
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
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/complete-profile" element={<CompleteProfile/>}/>
                    </Routes>
                </ProfileGuard>
            </main>
            <Footer/>
        </div>
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