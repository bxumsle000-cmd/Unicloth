import {
    BrowserRouter,
    Route,
    Routes,
} from "react-router-dom";

import Header from "./component/layout/Header.jsx";
import Footer from "./component/layout/Footer.jsx";
import ProfileGuard from "./component/ProfileGuard.jsx";
import RequireLogin from "./component/RequireLogin.jsx";

import Home from "./pages/store/Home.jsx";
import Category from "./pages/store/Category.jsx";
import Wishlist from "./pages/store/Wishlist.jsx";
import ProductDetail from "./pages/store/ProductDetail.jsx";
import Coupons from "./pages/store/Coupons.jsx";
import Cart from "./pages/store/Cart.jsx";
import Checkout from "./pages/store/Checkout.jsx";
import OrderComplete from "./pages/store/OrderComplete.jsx";
import Search from "./pages/store/Search.jsx";
import Orders from "./pages/store/Orders.jsx";
import Login from "./pages/store/Login.jsx";
import CompleteProfile from "./pages/store/CompleteProfile.jsx";

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import ProductDepartmentHome from "./pages/admin/ProductDepartmentHome.jsx";
import OrderHome from "./pages/admin/OrderHome.jsx";
import CsHome from "./pages/admin/CsHome.jsx";
import MktHome from "./pages/admin/MktHome.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";

import { LanguageProvider } from "./js/LanguageProvider.jsx";

/**
 * 前台版型。
 *
 * 上方顯示 Header、下方顯示 Footer，
 * 中間依照網址切換頁面。
 */
function StoreLayout() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1">
                <ProfileGuard>
                    <Routes>
                        <Route
                            path="/"
                            element={<Home />}
                        />

                        <Route
                            path="/category/:code"
                            element={<Category />}
                        />

                        <Route
                            path="/wishlist/"
                            element={
                                <RequireLogin>
                                    <Wishlist />
                                </RequireLogin>
                            }
                        />

                        <Route
                            path="/product/:slug"
                            element={<ProductDetail />}
                        />

                        <Route
                            path="/coupons"
                            element={
                                <RequireLogin>
                                    <Coupons />
                                </RequireLogin>
                            }
                        />

                        <Route
                            path="/cart"
                            element={
                                <RequireLogin>
                                    <Cart />
                                </RequireLogin>
                            }
                        />

                        <Route
                            path="/checkout"
                            element={
                                <RequireLogin>
                                    <Checkout />
                                </RequireLogin>
                            }
                        />

                        <Route
                            path="/order-complete"
                            element={<OrderComplete />}
                        />

                        <Route
                            path="/search"
                            element={<Search />}
                        />

                        <Route
                            path="/orders"
                            element={
                                <RequireLogin>
                                    <Orders />
                                </RequireLogin>
                            }
                        />

                        <Route
                            path="/login"
                            element={<Login />}
                        />

                        <Route
                            path="/complete-profile"
                            element={
                                <CompleteProfile />
                            }
                        />
                    </Routes>
                </ProfileGuard>
            </main>

            <Footer />
        </div>
    );
}

/**
 * 後台版型。
 *
 * 後台不使用前台 Header、Footer 或 ProfileGuard。
 * 這裡的路徑會接在 /admin/ 後面。
 */
function AdminLayout() {
    return (
        <Routes>
            <Route
                path="login"
                element={<AdminLogin />}
            />

            <Route
                path="product"
                element={
                    <ProductDepartmentHome />
                }
            />

            <Route
                path="order"
                element={<OrderHome />}
            />

            <Route
                path="cs"
                element={<CsHome />}
            />

            <Route
                path="mkt"
                element={<MktHome />}
            />

            <Route
                path="admin"
                element={<AdminHome />}
            />
        </Routes>
    );
}

function App() {
    return (
        <LanguageProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/admin/*"
                        element={<AdminLayout />}
                    />

                    <Route
                        path="*"
                        element={<StoreLayout />}
                    />
                </Routes>
            </BrowserRouter>
        </LanguageProvider>
    );
}

export default App;