import Header from "./component/layout/Header.jsx";
import Footer from "./component/layout/Footer.jsx";
import Home from "./pages/Home.jsx";
import Category from "./pages/Category.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Wishlist from "./pages/Wishlist.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Coupons from "./pages/Coupons.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderComplete from "./pages/OrderComplete.jsx";
import PaymentResult from "./pages/PaymentResult.jsx";
import Search from "./pages/Search.jsx";
import Orders from "./pages/Orders.jsx";
import Login from "./pages/Login.jsx";
import CompleteProfile from "./pages/CompleteProfile.jsx";
import ProfileGuard from "./component/ProfileGuard.jsx";
import RequireLogin from "./component/RequireLogin.jsx";
import { LanguageProvider } from "./js/LanguageProvider.jsx";

function App(){
    return (
        <LanguageProvider>
        <BrowserRouter>
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
                <Route path="/payment/result" element={<PaymentResult/>}/>
                <Route path="/search" element={<Search/>}/>
                <Route path="/orders" element={<RequireLogin><Orders/></RequireLogin>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/complete-profile" element={<CompleteProfile/>}/>
            </Routes>
            </ProfileGuard>
            </main>
            <Footer/>
        </div>
        </BrowserRouter>
        </LanguageProvider>
            )
}

export default App;
