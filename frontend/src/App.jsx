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
import Search from "./pages/Search.jsx";
import Orders from "./pages/Orders.jsx";
import Login from "./pages/Login.jsx";
import { LanguageProvider } from "./js/LanguageProvider.jsx";

function App(){
    return (
        <LanguageProvider>
        <BrowserRouter>
        <div className="flex min-h-screen flex-col">
            <Header/>
            <main className="flex-1">
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/category/:code" element={<Category/>}/>
                <Route path="/wishlist/" element={<Wishlist/>}/>
                <Route path="/product/:slug" element={<ProductDetail/>}/>
                <Route path="/coupons" element={<Coupons/>}/>
                <Route path="/cart" element={<Cart/>}/>
                <Route path="/checkout" element={<Checkout/>}/>
                <Route path="/order-complete" element={<OrderComplete/>}/>
                <Route path="/search" element={<Search/>}/>
                <Route path="/orders" element={<Orders/>}/>
                <Route path="/login" element={<Login/>}/>
            </Routes>
            </main>
            <Footer/>
        </div>
        </BrowserRouter>
        </LanguageProvider>
            )
}

export default App;
